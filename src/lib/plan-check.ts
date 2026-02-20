import { createClient } from '@/lib/supabase/server'

export type PlanAction = 
  | 'create_patient'
  | 'create_appointment'
  | 'access_notes'
  | 'access_reminders'
  | 'access_reports'

export interface PlanCheckResult {
  allowed: boolean
  current?: number
  limit?: number
  feature?: string
  upgradeUrl?: string
}

export async function checkPlanLimit(
  psychologistId: string,
  action: PlanAction
): Promise<PlanCheckResult> {
  const supabase = await createClient()

  const { data: psychologist, error: psychologistError } = await supabase
    .from('psychologists')
    .select('plan, plan_expires_at')
    .eq('id', psychologistId)
    .single()

  if (psychologistError || !psychologist) {
    return { allowed: false, feature: 'Erro ao verificar plano' }
  }

  const now = new Date()
  const planExpired = psychologist.plan_expires_at && new Date(psychologist.plan_expires_at) < now
  const plan = planExpired ? 'free' : psychologist.plan

  const { data: limits } = await supabase
    .from('plan_limits')
    .select('*')
    .eq('plan', plan)
    .single()

  if (!limits) {
    return { allowed: false, feature: 'Plano inválido' }
  }

  switch (action) {
    case 'create_patient': {
      const { count: patientCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('psychologist_id', psychologistId)

      const current = patientCount || 0
      if (current >= limits.max_patients) {
        return {
          allowed: false,
          current,
          limit: limits.max_patients,
          upgradeUrl: '/dashboard/upgrade'
        }
      }
      return { allowed: true, current, limit: limits.max_patients }
    }

    case 'create_appointment': {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: appointmentCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('psychologist_id', psychologistId)
        .gte('start_time', startOfMonth.toISOString())

      const current = appointmentCount || 0
      if (current >= limits.max_appointments_per_month) {
        return {
          allowed: false,
          current,
          limit: limits.max_appointments_per_month,
          upgradeUrl: '/dashboard/upgrade'
        }
      }
      return { allowed: true, current, limit: limits.max_appointments_per_month }
    }

    case 'access_notes':
      return { allowed: limits.has_notes, feature: 'Notas clínicas' }

    case 'access_reminders':
      return { allowed: limits.has_reminders, feature: 'Lembretes automatizados' }

    case 'access_reports':
      return { allowed: limits.has_reports, feature: 'Relatórios' }

    default:
      return { allowed: false, feature: 'Ação desconhecida' }
  }
}
