'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createCheckoutSession } from '@/lib/stripe'
import { checkPlanLimit } from '@/lib/plan-check'

const CONSENT_VERSION = '1.0'

const bookSlotSchema = z.object({
  slotId: z.string().min(1, 'Slot ID é obrigatório'),
  consent: z.boolean().refine(val => val === true, { message: 'Você deve aceitar os termos para continuar' }),
  appointmentType: z.enum(['presencial', 'videoconferencia']).optional(),
  patientData: z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    phone: z.string().optional(),
    cpf: z.string().optional(),
  }),
})

async function sendWhatsAppNotification(phone: string, message: string) {
  const whatsappApiKey = process.env.WHATSAPP_API_KEY
  
  if (!whatsappApiKey || whatsappApiKey === 'SUA_WHATSAPP_API_KEY_AQUI') {
    console.log('WhatsApp API não configurada. Mensagem:', message)
    return
  }

  const cleanPhone = phone.replace(/\D/g, '')
  const whatsappNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
  
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${whatsappApiKey}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: `whatsapp:+${whatsappNumber}`,
        From: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        Body: message,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Erro ao enviar WhatsApp:', error)
    }
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error)
  }
}

async function formatPhoneForPatient(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '')
  return cleanPhone.length >= 10 ? cleanPhone : null
}

export async function bookSlot(formData: FormData) {
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || 'unknown'
  const forwardedFor = headersList.get('x-forwarded-for') || 'unknown'
  const ip = forwardedFor.split(',')[0].trim()

  const supabase = await createClient()

  const rawData = {
    slotId: formData.get('slotId'),
    consent: formData.get('consent') === 'true',
    appointmentType: formData.get('appointmentType') as 'presencial' | 'videoconferencia' | null,
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

  const { slotId, patientData, appointmentType } = validated.data

  const { data: { user } } = await supabase.auth.getUser()

  let patientId: string
  let psychologistId: string
  let patientEmail: string

  if (user) {
    const { data: existingPatient, error: patientError } = await supabase
      .from('patients')
      .select('id, psychologist_id, email')
      .eq('user_id', user.id)
      .maybeSingle()

    if (patientError) {
      console.error('Erro ao buscar paciente:', patientError)
    }

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

  const planCheck = await checkPlanLimit(psychologistId, 'create_appointment')
  if (!planCheck.allowed) {
    return { 
      error: planCheck.limit 
        ? `Limite de ${planCheck.limit} consultas/mês atingido para este plano`
        : `Funcionalidade não disponível no seu plano`,
      upgradeUrl: planCheck.upgradeUrl
    }
  }

  const { data: slot, error: slotError } = await supabase
    .from('slots')
    .select('id, start_at, status')
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
    .update({ 
      status: 'booked',
      appointment_type: appointmentType || 'presencial'
    })
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

  if (patientData.phone) {
    const formattedDate = new Date(slot.start_at).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    const formattedTime = new Date(slot.start_at).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
    const appointmentTypeText = appointmentType === 'videoconferencia' ? 'Videoconferência' : 'Presencial'
    
    const whatsappMessage = `Olá ${patientData.name}! Sua consulta com ${psychologist.full_name} foi agendada com sucesso.\n\n📅 Data: ${formattedDate}\n⏰ Horário: ${formattedTime}\n🏥 Tipo: ${appointmentTypeText}\n\nEm caso de dúvidas, entre em contato conosco.`
    
    sendWhatsAppNotification(patientData.phone, whatsappMessage)
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
