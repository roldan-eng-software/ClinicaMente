'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const availabilityRuleSchema = z.object({
  day: z.number().min(0).max(6),
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  enabled: z.boolean(),
})

const availabilityDataSchema = z.array(availabilityRuleSchema)

function generateSlotsForRule(
  rule: { day_of_week: number; start_time: string; end_time: string; psychologist_id: string },
  sessionDurationMinutes: number,
  startDate: Date,
  endDate: Date
): { scheduled_at: Date; psychologist_id: string; status: string }[] {
  const slots: { scheduled_at: Date; psychologist_id: string; status: string }[] = []
  
  const [startHour, startMin] = rule.start_time.split(':').map(Number)
  const [endHour, endMin] = rule.end_time.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  let currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    if (currentDate.getDay() === rule.day_of_week) {
      let slotStartMinutes = startMinutes
      
      while (slotStartMinutes + sessionDurationMinutes <= endMinutes) {
        const slotDate = new Date(currentDate)
        slotDate.setHours(Math.floor(slotStartMinutes / 60), slotStartMinutes % 60, 0, 0)
        
        slots.push({
          scheduled_at: slotDate,
          psychologist_id: rule.psychologist_id,
          status: 'available',
        })
        
        slotStartMinutes += sessionDurationMinutes
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return slots
}

export async function saveAvailabilityData(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const { data: psychologist } = await supabase
    .from('psychologists')
    .select('id, session_duration_minutes')
    .eq('user_id', user.id)
    .single()

  if (!psychologist) {
    return { error: 'Psicólogo não encontrado' }
  }

  const rawData = formData.get('availability')
  
  let parsedAvailability
  try {
    parsedAvailability = JSON.parse(rawData as string)
  } catch {
    return { error: 'Dados de disponibilidade inválidos' }
  }

  const validated = availabilityDataSchema.safeParse(parsedAvailability)

  if (!validated.success) {
    const firstError = validated.error.issues[0]
    return { error: firstError?.message || 'Erro de validação' }
  }

  const enabledRules = validated.data.filter(r => r.enabled)

  if (enabledRules.length === 0) {
    return { error: 'Selecione pelo menos um dia de disponibilidade' }
  }

  for (const rule of enabledRules) {
    const [startHour] = rule.start.split(':').map(Number)
    const [endHour] = rule.end.split(':').map(Number)
    
    if (startHour >= endHour) {
      return { error: `Horário final deve ser maior que inicial para ${['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][rule.day]}` }
    }
  }

  const { data: existingRules } = await supabase
    .from('availability_rules')
    .select('id')
    .eq('psychologist_id', psychologist.id)

  if (existingRules && existingRules.length > 0) {
    await supabase
      .from('availability_rules')
      .delete()
      .eq('psychologist_id', psychologist.id)

    await supabase
      .from('slots')
      .delete()
      .eq('psychologist_id', psychologist.id)
      .eq('status', 'available')
  }

  const rulesToInsert = enabledRules.map(r => ({
    psychologist_id: psychologist.id,
    day_of_week: r.day,
    start_time: r.start,
    end_time: r.end,
    is_active: true,
  }))

  const { error: rulesError } = await supabase
    .from('availability_rules')
    .insert(rulesToInsert)

  if (rulesError) {
    return { error: rulesError.message }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + 60)

  const allSlots: { scheduled_at: Date; psychologist_id: string; status: string }[] = []

  for (const rule of rulesToInsert) {
    const ruleSlots = generateSlotsForRule(
      rule,
      psychologist.session_duration_minutes || 50,
      today,
      futureDate
    )
    allSlots.push(...ruleSlots)
  }

  if (allSlots.length > 0) {
    const { error: slotsError } = await supabase
      .from('slots')
      .insert(allSlots)

    if (slotsError) {
      console.error('Error generating slots:', slotsError)
    }
  }

  return { 
    success: true, 
    rulesCreated: rulesToInsert.length,
    slotsGenerated: allSlots.length
  }
}
