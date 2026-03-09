'use server'

import { getAuthenticatedPsychologist } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function createSubscription(formData: FormData) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado' }

  if (psychologist.plan === 'pro') {
    return { error: 'Você já possui o plano Pro' }
  }

  try {
    const { createSubscriptionCheckout } = await import('@/lib/stripe')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const session = await createSubscriptionCheckout({
      psychologistId: psychologist.id,
      psychologistEmail: psychologist.clinicEmail || '',
      psychologistName: psychologist.fullName,
      successUrl: `${baseUrl}/dashboard/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/dashboard/upgrade?cancelled=1`,
    })

    if (!session.url) {
      return { error: 'Erro ao criar sessão de pagamento' }
    }

    return { url: session.url }
  } catch (err: any) {
    console.error('Erro ao criar assinatura:', err)
    return { error: err.message || 'Erro ao processar pagamento' }
  }
}
