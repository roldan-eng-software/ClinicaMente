'use server'

import { getAuthenticatedPsychologist } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const clinicDataSchema = z.object({
  fullName: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string()
    .min(1, 'URL é obrigatória')
    .regex(/^[a-z0-9-]+$/, 'URL deve ter apenas letras minúsculas, números e hifens')
    .regex(/^[a-z0-9]/, 'URL deve começar com letra ou número')
    .regex(/[a-z0-9]$/, 'URL deve terminar com letra ou número'),
  crp: z.string().min(1, 'CRP é obrigatório').regex(/^\d{2}\/\d{6}$/, 'CRP deve estar no formato 00/000000'),
  specialty: z.string().optional(),
  bio: z.string().optional(),
  timezone: z.string().optional(),
})

export async function saveClinicData(formData: FormData) {
  const { error, psychologist, userId } = await getAuthenticatedPsychologist()
  if (error || !userId) return { error: error || 'Usuário não autenticado' }

  const rawData = {
    fullName: formData.get('fullName'),
    slug: formData.get('slug'),
    crp: formData.get('crp'),
    specialty: formData.get('specialty'),
    bio: formData.get('bio'),
    timezone: formData.get('timezone'),
  }

  const validated = clinicDataSchema.safeParse(rawData)

  if (!validated.success) {
    const firstError = validated.error.issues[0]
    return { error: firstError?.message || 'Erro de validação' }
  }

  // Check slug uniqueness
  const existing = await prisma.psychologist.findFirst({
    where: {
      slug: validated.data.slug,
      NOT: { userId },
    },
    select: { id: true },
  })

  if (existing) {
    return { error: 'Esta URL já está em uso. Escolha outra.' }
  }

  try {
    if (psychologist) {
      await prisma.psychologist.update({
        where: { id: psychologist.id },
        data: {
          fullName: validated.data.fullName,
          slug: validated.data.slug,
          crp: validated.data.crp,
          specialty: validated.data.specialty || null,
          bio: validated.data.bio || null,
          timezone: validated.data.timezone || 'America/Sao_Paulo',
        },
      })
    } else {
      await prisma.psychologist.create({
        data: {
          userId,
          fullName: validated.data.fullName,
          slug: validated.data.slug,
          crp: validated.data.crp,
          specialty: validated.data.specialty || null,
          bio: validated.data.bio || null,
          timezone: validated.data.timezone || 'America/Sao_Paulo',
        },
      })
    }
  } catch (e: any) {
    return { error: e.message || 'Erro ao salvar dados' }
  }

  return { success: true }
}
