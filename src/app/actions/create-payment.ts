'use server'

import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe'
import { redirect } from 'next/navigation'

export async function createPaymentSession(appointmentId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const { data: appointment } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_at,
      psychologist:psychologists(id, full_name, default_session_price),
      patient:patients(email)
    `)
    .eq('id', appointmentId)
    .single()

  if (!appointment) {
    return { error: 'Agendamento não encontrado' }
  }

  const psychologist = appointment.psychologist as any
  const patient = appointment.patient as any
  
  const amount = psychologist.default_session_price || 15000

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const session = await createCheckoutSession({
    appointmentId: appointment.id,
    psychologistName: psychologist.full_name,
    patientEmail: patient.email,
    amount,
    successUrl: `${baseUrl}/p/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${baseUrl}/p/cancel`,
  })

  if (!session.url) {
    return { error: 'Erro ao criar sessão de pagamento' }
  }

  redirect(session.url)
}
