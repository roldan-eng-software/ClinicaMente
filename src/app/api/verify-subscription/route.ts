import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { stripe, retrieveCheckoutSession } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

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
    const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000)

    await prisma.psychologist.update({
      where: { id: psychologistId },
      data: {
        plan: 'pro',
        planExpiresAt: currentPeriodEnd,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error verifying subscription:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
