'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
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

export async function bookSlot(formData: FormData) {
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || 'unknown'
  const ip = (headersList.get('x-forwarded-for') || 'unknown').split(',')[0].trim()

  const session = await auth()

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
    return { error: validated.error.issues[0]?.message || 'Erro de validação' }
  }

  const { slotId, patientData, appointmentType } = validated.data

  if (!session?.user?.id) return { error: 'Usuário não autenticado' }

  // Find patient
  const patient = await prisma.patient.findFirst({
    where: { email: patientData.email },
    select: { id: true, psychologistId: true, email: true },
  })

  if (!patient) return { error: 'Paciente não encontrado. Faça login novamente.' }

  const psychologistId = patient.psychologistId

  const psychologist = await prisma.psychologist.findUnique({
    where: { id: psychologistId },
    select: { id: true, fullName: true, slug: true },
  })

  if (!psychologist) return { error: 'Psicólogo não encontrado' }

  const planCheck = await checkPlanLimit(psychologistId, 'create_appointment')
  if (!planCheck.allowed) {
    return {
      error: planCheck.limit
        ? `Limite de ${planCheck.limit} consultas/mês atingido para este plano`
        : `Funcionalidade não disponível no seu plano`,
      upgradeUrl: planCheck.upgradeUrl,
    }
  }

  // Find slot
  const slot = await prisma.slot.findFirst({
    where: { id: slotId, psychologistId, isActive: true },
  })

  if (!slot) return { error: 'Slot não encontrado ou já reservado' }

  // Create appointment
  const now = new Date()
  const dayOfWeek = slot.dayOfWeek
  const [startHour, startMin] = slot.startTime.split(':').map(Number)

  // Find the next occurrence of this day of week
  const appointmentDate = new Date(now)
  while (appointmentDate.getDay() !== dayOfWeek) {
    appointmentDate.setDate(appointmentDate.getDate() + 1)
  }
  appointmentDate.setHours(startHour, startMin, 0, 0)

  let appointment
  try {
    appointment = await prisma.appointment.create({
      data: {
        psychologistId,
        patientId: patient.id,
        slotId,
        dateTime: appointmentDate,
        status: 'scheduled',
        type: appointmentType || 'presencial',
        patientName: patientData.name,
        patientEmail: patientData.email,
        patientPhone: patientData.phone || null,
      },
    })
  } catch (e) {
    console.error('Error creating appointment:', e)
    return { error: 'Erro ao criar agendamento' }
  }

  // Log consent
  await prisma.consentLog.create({
    data: {
      patientId: patient.id,
      psychologistId,
      consentType: 'booking',
      granted: true,
      ipAddress: ip,
      userAgent,
    },
  })

  // Create payment
  const payment = await prisma.payment.create({
    data: {
      psychologistId,
      patientId: patient.id,
      appointmentId: appointment.id,
      amount: 15000,
      status: 'pending',
      method: 'pending',
    },
  })

  // Create Stripe checkout
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const checkoutSession = await createCheckoutSession({
      appointmentId: appointment.id,
      psychologistName: psychologist.fullName,
      patientEmail: patient.email || '',
      amount: 15000,
      successUrl: `${baseUrl}/p/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/p/${psychologist.slug}/book?cancelled=1`,
    })

    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripePaymentId: checkoutSession.id, status: 'pending' },
    })

    return {
      success: true,
      paymentUrl: checkoutSession.url,
      appointmentId: appointment.id,
    }
  } catch (err: any) {
    console.error('Erro ao criar sessão de pagamento:', err)

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'cancelled' },
    })

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'cancelled' },
    })

    return { error: 'Erro ao processar pagamento. Tente novamente.' }
  }
}
