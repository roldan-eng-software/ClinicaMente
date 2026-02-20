'use server'

import { createClient } from '@/lib/supabase/server'
import { createSubscriptionCheckout } from '@/lib/stripe'
import { redirect } from 'next/navigation'

export async function createSubscription(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: psychologist, error: psychologistError } = await supabase
    .from('psychologists')
    .select('id, email, full_name, plan')
    .eq('user_id', user.id)
    .single()

  if (psychologistError || !psychologist) {
    return { error: 'Psicólogo não encontrado' }
  }

  if (psychologist.plan === 'pro') {
    return { error: 'Você já possui o plano Pro' }
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const session = await createSubscriptionCheckout({
      psychologistId: psychologist.id,
      psychologistEmail: psychologist.email || user.email || '',
      psychologistName: psychologist.full_name,
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
