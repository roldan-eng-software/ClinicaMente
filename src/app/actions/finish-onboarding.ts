'use server'

import { getAuthenticatedPsychologist } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function finishOnboarding() {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado' }

  if (!psychologist.slug) {
    return { error: 'Slug não encontrado. Complete o cadastro primeiro.' }
  }

  try {
    await prisma.psychologist.update({
      where: { id: psychologist.id },
      data: { onboardingCompleted: true },
    })
  } catch (e: any) {
    return { error: e.message || 'Erro ao finalizar onboarding' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/p/${psychologist.slug}`)

  return {
    success: true,
    slug: psychologist.slug,
    name: psychologist.fullName,
  }
}
