import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Assinatura ou segredo do webhook não encontrado' },
      { status: 400 }
    )
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err: any) {
    console.error('Erro na verificação do webhook:', err.message)
    return NextResponse.json(
      { error: `Erro no webhook: ${err.message}` },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, appointment_id, psychologist_id')
      .eq('stripe_session_id', session.id)
      .single()

    if (paymentError || !payment) {
      console.error('Payment não encontrado para session:', session.id)
      return NextResponse.json({ error: 'Payment não encontrado' }, { status: 404 })
    }

    const { appointment_id, psychologist_id } = payment

    await supabase
      .from('payments')
      .update({ 
        status: 'paid',
        payment_method: session.payment_method_types?.[0] || 'card',
        paid_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', appointment_id)

    console.log(`Pagamento confirmado para appointment ${appointment_id}`)
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as any
    
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, appointment_id, psychologist_id')
      .eq('stripe_session_id', session.id)
      .single()

    if (paymentError || !payment) {
      console.error('Payment não encontrado para session:', session.id)
      return NextResponse.json({ error: 'Payment não encontrado' }, { status: 404 })
    }

    const { appointment_id } = payment

    const { data: appointment } = await supabase
      .from('appointments')
      .select('slot_id')
      .eq('id', appointment_id)
      .single()

    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('id', payment.id)

    await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointment_id)

    if (appointment?.slot_id) {
      await supabase
        .from('slots')
        .update({ status: 'available' })
        .eq('id', appointment.slot_id)
    }

    console.log(`Pagamento expirado para appointment ${appointment_id}, slot liberado`)
  }

  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object as any
    const psychologistId = subscription.metadata?.psychologistId

    if (psychologistId) {
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

      await supabase
        .from('psychologists')
        .update({
          plan: 'pro',
          plan_expires_at: currentPeriodEnd.toISOString(),
          stripe_subscription_id: subscription.id,
        })
        .eq('id', psychologistId)

      console.log(`Assinatura Pro ativada para psicólogo ${psychologistId}`)
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as any
    const psychologistId = subscription.metadata?.psychologistId

    if (psychologistId) {
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
      const status = subscription.status

      if (status === 'active') {
        await supabase
          .from('psychologists')
          .update({
            plan: 'pro',
            plan_expires_at: currentPeriodEnd.toISOString(),
          })
          .eq('id', psychologistId)

        console.log(`Assinatura Pro renovada para psicólogo ${psychologistId}`)
      } else if (status === 'canceled' || status === 'unpaid') {
        await supabase
          .from('psychologists')
          .update({
            plan: 'free',
            plan_expires_at: currentPeriodEnd.toISOString(),
          })
          .eq('id', psychologistId)

        console.log(`Assinatura Pro cancelada/expirada para psicólogo ${psychologistId}`)
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as any

    const { data: psychologist } = await supabase
      .from('psychologists')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (psychologist) {
      await supabase
        .from('psychologists')
        .update({
          plan: 'free',
          plan_expires_at: null,
          stripe_subscription_id: null,
        })
        .eq('id', psychologist.id)

      console.log(`Assinatura Pro encerrada para psicólogo ${psychologist.id}`)
    }
  }

  return NextResponse.json({ received: true })
}
