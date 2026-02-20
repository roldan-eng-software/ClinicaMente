import { NextResponse } from 'next/server'
import { stripe, retrieveCheckoutSession } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const session = await retrieveCheckoutSession(sessionId)

    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const psychologistId = session.metadata?.psychologistId

    if (!psychologistId) {
      return NextResponse.json({ error: 'Psychologist ID not found' }, { status: 400 })
    }

    const subscriptionId = session.subscription as string

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 400 })
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

    const supabase = await createClient()

    const { error: updateError } = await supabase
      .from('psychologists')
      .update({
        plan: 'pro',
        plan_expires_at: currentPeriodEnd.toISOString(),
        stripe_subscription_id: subscriptionId,
      })
      .eq('id', psychologistId)

    if (updateError) {
      console.error('Error updating psychologist plan:', updateError)
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error verifying subscription:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
