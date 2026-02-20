import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY não configurada')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
})

export async function createCheckoutSession({
  appointmentId,
  psychologistName,
  patientEmail,
  amount,
  successUrl,
  cancelUrl,
}: {
  appointmentId: string
  psychologistName: string
  patientEmail: string
  amount: number
  successUrl: string
  cancelUrl: string
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'pix'],
    line_items: [
      {
        price_data: {
          currency: 'brl',
          product_data: {
            name: `Sessão com ${psychologistName}`,
            description: 'Agendamento de sessão de psicologia',
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: patientEmail,
    metadata: {
      appointmentId,
    },
  })

  return session
}

export async function retrieveCheckoutSession(sessionId: string) {
  return stripe.checkout.sessions.retrieve(sessionId)
}
