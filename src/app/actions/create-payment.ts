'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession } from '@/lib/stripe'
import { redirect } from 'next/navigation'

export async function createPaymentSession(appointmentId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Usuário não autenticado' }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      psychologist: { select: { id: true, fullName: true, slug: true } },
      patient: { select: { email: true } },
    },
  })

  if (!appointment) return { error: 'Agendamento não encontrado' }

  const amount = 15000 // default session price in cents
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const checkoutSession = await createCheckoutSession({
    appointmentId: appointment.id,
    psychologistName: appointment.psychologist.fullName,
    patientEmail: appointment.patient?.email || '',
    amount,
    successUrl: `${baseUrl}/p/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${baseUrl}/p/cancel`,
  })

  if (!checkoutSession.url) return { error: 'Erro ao criar sessão de pagamento' }

  redirect(checkoutSession.url)
}
