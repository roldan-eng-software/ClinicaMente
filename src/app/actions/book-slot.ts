'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createCheckoutSession } from '@/lib/stripe'

const CONSENT_VERSION = '1.0'

const bookSlotSchema = z.object({
  slotId: z.string().min(1, 'Slot ID é obrigatório'),
  consent: z.boolean().refine(val => val === true, { message: 'Você deve aceitar os termos para continuar' }),
  patientData: z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    phone: z.string().optional(),
    cpf: z.string().optional(),
  }),
})

export async function bookSlot(formData: FormData) {
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || 'unknown'
  const forwardedFor = headersList.get('x-forwarded-for') || 'unknown'
  const ip = forwardedFor.split(',')[0].trim()

  const supabase = await createClient()

  const rawData = {
    slotId: formData.get('slotId'),
    consent: formData.get('consent') === 'true',
    patientData: {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      cpf: formData.get('cpf'),
    },
  }

  const validated = bookSlotSchema.safeParse(rawData)

  if (!validated.success) {
    const firstError = validated.error.issues[0]
    return { error: firstError?.message || 'Erro de validação' }
  }

  const { slotId, patientData } = validated.data

  const { data: { user } } = await supabase.auth.getUser()

  let patientId: string
  let psychologistId: string
  let patientEmail: string

  if (user) {
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id, psychologist_id, email')
      .eq('user_id', user.id)
      .single()

    if (existingPatient) {
      patientId = existingPatient.id
      psychologistId = existingPatient.psychologist_id
      patientEmail = existingPatient.email
    } else {
      return { error: 'Paciente não encontrado. Faça login novamente.' }
    }
  } else {
    return { error: 'Usuário não autenticado' }
  }

  const { data: psychologist } = await supabase
    .from('psychologists')
    .select('id, full_name, default_session_price')
    .eq('id', psychologistId)
    .single()

  if (!psychologist) {
    return { error: 'Psicólogo não encontrado' }
  }

  const { data: planData } = await supabase
    .from('plan_limits')
    .select('plan_type')
    .eq('psychologist_id', psychologistId)
    .single()

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: monthAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('psychologist_id', psychologistId)
    .gte('scheduled_at', startOfMonth.toISOString())
    .neq('status', 'cancelled')

  const maxAppointments = planData?.plan_type === 'pro' ? 100 : 30

  if (monthAppointments !== null && monthAppointments >= maxAppointments) {
    return { error: `Limite de ${maxAppointments} consultas/mês atingido para este plano` }
  }

  const { data: slot, error: slotError } = await supabase
    .from('slots')
    .select('id, scheduled_at, status')
    .eq('id', slotId)
    .eq('psychologist_id', psychologistId)
    .single()

  if (slotError || !slot) {
    return { error: 'Slot não encontrado' }
  }

  if (slot.status !== 'available') {
    return { error: 'Este horário já foi reservado por outro paciente' }
  }

  const { error: updateSlotError } = await supabase
    .from('slots')
    .update({ status: 'booked' })
    .eq('id', slotId)
    .eq('status', 'available')

  if (updateSlotError) {
    return { error: 'Erro ao reservar horário. Tente novamente.' }
  }

  const { data: updatedSlot } = await supabase
    .from('slots')
    .select('status')
    .eq('id', slotId)
    .single()

  if (updatedSlot?.status !== 'booked') {
    return { error: 'Este horário acabou de ser reservado. Por favor, escolha outro.' }
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      psychologist_id: psychologistId,
      patient_id: patientId,
      slot_id: slotId,
      scheduled_at: slot.scheduled_at,
      status: 'scheduled',
    })
    .select()
    .single()

  if (appointmentError) {
    await supabase
      .from('slots')
      .update({ status: 'available' })
      .eq('id', slotId)
    
    return { error: 'Erro ao criar agendamento' }
  }

  const sessionPrice = psychologist.default_session_price || 15000

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      psychologist_id: psychologistId,
      patient_id: patientId,
      appointment_id: appointment.id,
      amount: sessionPrice,
      status: 'pending',
      payment_method: 'pending',
    })
    .select()
    .single()

  if (paymentError) {
    await supabase
      .from('appointments')
      .delete()
      .eq('id', appointment.id)
    
    await supabase
      .from('slots')
      .update({ status: 'available' })
      .eq('id', slotId)
    
    return { error: 'Erro ao criar registro de pagamento' }
  }

  await supabase
    .from('consent_logs')
    .insert({
      patient_id: patientId,
      psychologist_id: psychologistId,
      consent_type: 'booking',
      consent_version: CONSENT_VERSION,
      ip_address: ip,
      user_agent: userAgent,
      granted: true,
    })

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    const checkoutSession = await createCheckoutSession({
      appointmentId: appointment.id,
      psychologistName: psychologist.full_name,
      patientEmail: patientEmail,
      amount: sessionPrice,
      successUrl: `${baseUrl}/p/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/p/${(await supabase.from('psychologists').select('slug').eq('id', psychologistId).single()).data?.slug}/book?cancelled=1`,
    })

    await supabase
      .from('payments')
      .update({ 
        stripe_session_id: checkoutSession.id,
        status: 'pending_payment'
      })
      .eq('id', payment.id)

    return { 
      success: true, 
      paymentUrl: checkoutSession.url,
      appointmentId: appointment.id,
    }
  } catch (err: any) {
    console.error('Erro ao criar sessão de pagamento:', err)
    
    await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointment.id)
    
    await supabase
      .from('slots')
      .update({ status: 'available' })
      .eq('id', slotId)
    
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('id', payment.id)
    
    return { error: 'Erro ao processar pagamento. Tente novamente.' }
  }
}
