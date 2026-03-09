'use server'

import { getAuthenticatedPsychologist } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const financialDataSchema = z.object({
  sessionPrice: z.coerce.number().min(0, 'Valor deve ser positivo'),
  sessionDuration: z.coerce.number().min(15, 'Duração mínima de 15 minutos'),
  cancellationPolicy: z.coerce.number().min(0, 'Política de cancelamento inválida'),
  paymentMethod: z.enum(['antecipado', 'pos_consulta', 'manual']),
})

export async function saveFinancialData(formData: FormData) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado' }

  const rawData = {
    sessionPrice: formData.get('sessionPrice'),
    sessionDuration: formData.get('sessionDuration'),
    cancellationPolicy: formData.get('cancellationPolicy'),
    paymentMethod: formData.get('paymentMethod'),
  }

  const validated = financialDataSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Erro de validação' }
  }

  try {
    await prisma.psychologist.update({
      where: { id: psychologist.id },
      data: {
        sessionDurationMinutes: validated.data.sessionDuration,
      },
    })
  } catch (e: any) {
    return { error: e.message || 'Erro ao salvar dados financeiros' }
  }

  return { success: true }
}
