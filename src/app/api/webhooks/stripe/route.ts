import { headers } from 'next/headers'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any

    const payment = await prisma.payment.findFirst({
      where: { stripePaymentId: session.id },
    })

    if (!payment) {
      console.error('Payment não encontrado para session:', session.id)
      return NextResponse.json({ error: 'Payment não encontrado' }, { status: 404 })
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'paid',
        method: session.payment_method_types?.[0] || 'card',
        paidAt: new Date(),
      },
    })

    if (payment.appointmentId) {
      await prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: { status: 'confirmed' },
      })
    }

    console.log(`Pagamento confirmado para appointment ${payment.appointmentId}`)
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as any

    const payment = await prisma.payment.findFirst({
      where: { stripePaymentId: session.id },
    })

    if (!payment) {
      console.error('Payment não encontrado para session:', session.id)
      return NextResponse.json({ error: 'Payment não encontrado' }, { status: 404 })
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'failed' },
    })

    if (payment.appointmentId) {
      await prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: { status: 'cancelled' },
      })
    }

    console.log(`Pagamento expirado para appointment ${payment.appointmentId}`)
  }

  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object as any
    const psychologistId = subscription.metadata?.psychologistId

    if (psychologistId) {
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

      await prisma.psychologist.update({
        where: { id: psychologistId },
        data: {
          plan: 'pro',
          planExpiresAt: currentPeriodEnd,
        },
      })

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
        await prisma.psychologist.update({
          where: { id: psychologistId },
          data: {
            plan: 'pro',
            planExpiresAt: currentPeriodEnd,
          },
        })
        console.log(`Assinatura Pro renovada para psicólogo ${psychologistId}`)
      } else if (status === 'canceled' || status === 'unpaid') {
        await prisma.psychologist.update({
          where: { id: psychologistId },
          data: {
            plan: 'free',
            planExpiresAt: currentPeriodEnd,
          },
        })
        console.log(`Assinatura Pro cancelada/expirada para psicólogo ${psychologistId}`)
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as any

    // Find by stripe subscription in metadata
    const psychologistId = subscription.metadata?.psychologistId
    if (psychologistId) {
      await prisma.psychologist.update({
        where: { id: psychologistId },
        data: {
          plan: 'free',
          planExpiresAt: null,
        },
      })
      console.log(`Assinatura Pro encerrada para psicólogo ${psychologistId}`)
    }
  }

  return NextResponse.json({ received: true })
}
