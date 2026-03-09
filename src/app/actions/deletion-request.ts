'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { headers } from 'next/headers'

const deletionRequestSchema = z.object({
  requestType: z.enum(['anonymize', 'delete']),
  reason: z.string().optional(),
})

const EMAIL_API_KEY = process.env.EMAIL_API_KEY || ''
const PLATFORM_EMAIL = 'contato@clinicamente.app'

export async function createDeletionRequest(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Usuário não autenticado' }

  const rawData = {
    requestType: formData.get('requestType'),
    reason: formData.get('reason'),
  }

  const validated = deletionRequestSchema.safeParse(rawData)
  if (!validated.success) return { error: 'Dados inválidos' }

  const { requestType, reason } = validated.data

  // Find patient by email (patient-facing)
  const patient = await prisma.patient.findFirst({
    where: { email: session.user.email || '' },
    select: { id: true, psychologistId: true, email: true, fullName: true },
  })

  if (!patient) return { error: 'Paciente não encontrado' }

  const psychologist = await prisma.psychologist.findUnique({
    where: { id: patient.psychologistId },
    select: { id: true, fullName: true, clinicEmail: true },
  })

  // Log deletion request in consent_logs
  await prisma.consentLog.create({
    data: {
      patientId: patient.id,
      psychologistId: patient.psychologistId,
      consentType: `data_${requestType}_request`,
      granted: true,
      ipAddress: (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
      userAgent: (await headers()).get('user-agent') || 'unknown',
    },
  })

  // Email notifications would go here (SendGrid integration)
  if (EMAIL_API_KEY && psychologist?.clinicEmail) {
    console.log(`Would send deletion request notification to ${psychologist.clinicEmail}`)
  }

  return { success: true }
}

export async function completeDeletionRequest(
  requestId: string,
  status: 'completed' | 'partially_completed',
  notes: string
) {
  // This is an admin action, just log a consent entry
  console.log(`Deletion request ${requestId} marked as ${status}: ${notes}`)
  return { success: true }
}
