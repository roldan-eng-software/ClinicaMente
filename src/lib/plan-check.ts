'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function checkPlanLimit(
  psychologistId: string,
  action: string
): Promise<{ allowed: boolean; limit?: number; upgradeUrl?: string }> {
  const psychologist = await prisma.psychologist.findUnique({
    where: { id: psychologistId },
    select: { plan: true },
  })

  if (!psychologist) return { allowed: false }

  const plan = psychologist.plan

  // Pro plan: no limits
  if (plan === 'pro') return { allowed: true }

  // Free plan limits
  const limits: Record<string, number> = {
    create_appointment: 10,
    create_patient: 5,
  }

  const limit = limits[action]
  if (!limit) return { allowed: true }

  // Count current month usage
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  let count = 0

  if (action === 'create_appointment') {
    count = await prisma.appointment.count({
      where: {
        psychologistId,
        createdAt: { gte: startOfMonth },
      },
    })
  } else if (action === 'create_patient') {
    count = await prisma.patient.count({
      where: {
        psychologistId,
        createdAt: { gte: startOfMonth },
      },
    })
  }

  if (count >= limit) {
    return {
      allowed: false,
      limit,
      upgradeUrl: '/dashboard/upgrade',
    }
  }

  return { allowed: true }
}
