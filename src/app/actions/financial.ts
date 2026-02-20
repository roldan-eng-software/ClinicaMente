'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const financialDataSchema = z.object({
  sessionPrice: z.coerce.number().min(0, 'Valor deve ser positivo'),
  sessionDuration: z.coerce.number().min(15, 'Duração mínima de 15 minutos'),
  cancellationPolicy: z.coerce.number().min(0, 'Política de cancelamento inválida'),
  paymentMethod: z.enum(['antecipado', 'pos_consulta', 'manual']),
})

export async function saveFinancialData(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const rawData = {
    sessionPrice: formData.get('sessionPrice'),
    sessionDuration: formData.get('sessionDuration'),
    cancellationPolicy: formData.get('cancellationPolicy'),
    paymentMethod: formData.get('paymentMethod'),
  }

  const validated = financialDataSchema.safeParse(rawData)

  if (!validated.success) {
    const firstError = validated.error.issues[0]
    return { error: firstError?.message || 'Erro de validação' }
  }

  const { error: updateError } = await supabase
    .from('psychologists')
    .update({
      default_session_price: validated.data.sessionPrice,
      session_duration_minutes: validated.data.sessionDuration,
      cancellation_policy_hours: validated.data.cancellationPolicy,
    })
    .eq('user_id', user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  return { success: true }
}
