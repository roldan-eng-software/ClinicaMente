'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function finishOnboarding() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const { data: psychologist, error: fetchError } = await supabase
    .from('psychologists')
    .select('slug, full_name')
    .eq('user_id', user.id)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (!psychologist?.slug) {
    return { error: 'Slug não encontrado. Complete o cadastro primeiro.' }
  }

  const { error: updateError } = await supabase
    .from('psychologists')
    .update({ onboarding_completed: true })
    .eq('user_id', user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/p/${psychologist.slug}`)

  return { 
    success: true, 
    slug: psychologist.slug,
    name: psychologist.full_name
  }
}
