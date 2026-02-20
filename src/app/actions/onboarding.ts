'use server'

import { createClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

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

  const { data: existing } = await supabase
    .from('psychologists')
    .select('id')
    .eq('slug', validated.data.slug)
    .neq('user_id', user.id)
    .single()

  if (existing) {
    return { error: 'Esta URL já está em uso. Escolha outra.' }
  }

  const { error: updateError } = await supabase
    .from('psychologists')
    .update({
      full_name: validated.data.fullName,
      slug: validated.data.slug,
      crp: validated.data.crp,
      specialty: validated.data.specialty || null,
      bio: validated.data.bio || null,
      timezone: validated.data.timezone || 'America/Sao_Paulo',
    })
    .eq('user_id', user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  return { success: true }
}
