'use server'

import { getAuthenticatedPsychologist } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const availabilityRuleSchema = z.object({
  day: z.number().min(0).max(6),
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido'),
  enabled: z.boolean(),
})

const availabilityDataSchema = z.array(availabilityRuleSchema)

export async function saveAvailabilityData(formData: FormData) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado' }

  const rawData = formData.get('availability')

  let parsedAvailability
  try {
    parsedAvailability = JSON.parse(rawData as string)
  } catch {
    return { error: 'Dados de disponibilidade inválidos' }
  }

  const validated = availabilityDataSchema.safeParse(parsedAvailability)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || 'Erro de validação' }
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

  try {
    // Delete existing rules
    await prisma.availabilityRule.deleteMany({
      where: { psychologistId: psychologist.id },
    })

    // Insert new rules
    await prisma.availabilityRule.createMany({
      data: enabledRules.map(r => ({
        psychologistId: psychologist.id,
        dayOfWeek: r.day,
        startTime: r.start,
        endTime: r.end,
        isActive: true,
      })),
    })

    // Generate slots for the next 60 days
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + 60)

    // Delete old available slots
    await prisma.slot.deleteMany({
      where: { psychologistId: psychologist.id, isActive: true },
    })

    // Generate new slots
    const sessionDuration = psychologist.sessionDurationMinutes || 50
    const slotsToCreate: { psychologistId: string; dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }[] = []

    for (const rule of enabledRules) {
      const [startHour, startMin] = rule.start.split(':').map(Number)
      const [endHour, endMin] = rule.end.split(':').map(Number)
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin

      let slotStartMinutes = startMinutes
      while (slotStartMinutes + sessionDuration <= endMinutes) {
        const slotEndMinutes = slotStartMinutes + sessionDuration
        const slotStart = `${String(Math.floor(slotStartMinutes / 60)).padStart(2, '0')}:${String(slotStartMinutes % 60).padStart(2, '0')}`
        const slotEnd = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')}:${String(slotEndMinutes % 60).padStart(2, '0')}`

        slotsToCreate.push({
          psychologistId: psychologist.id,
          dayOfWeek: rule.day,
          startTime: slotStart,
          endTime: slotEnd,
          isActive: true,
        })

        slotStartMinutes += sessionDuration
      }
    }

    if (slotsToCreate.length > 0) {
      await prisma.slot.createMany({ data: slotsToCreate })
    }

    return {
      success: true,
      rulesCreated: enabledRules.length,
      slotsGenerated: slotsToCreate.length,
    }
  } catch (e) {
    console.error('Error saving availability:', e)
    return { error: 'Erro ao salvar disponibilidade' }
  }
}
