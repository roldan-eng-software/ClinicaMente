'use server'

import { getAuthenticatedPsychologist } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createManualAppointment(formData: FormData) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado' }

  const patientId = formData.get('patientId') as string
  const date = formData.get('date') as string
  const time = formData.get('time') as string
  const roomId = formData.get('roomId') as string
  const appointmentType = formData.get('appointmentType') as string
  const notes = formData.get('notes') as string

  if (!patientId || !date || !time) {
    return { error: 'Preencha todos os campos obrigatórios' }
  }

  const sessionDuration = psychologist.sessionDurationMinutes || 50

  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  const startDateTime = new Date(year, month - 1, day, hours, minutes)
  const endDateTime = new Date(startDateTime.getTime() + sessionDuration * 60000)

  try {
    await prisma.appointment.create({
      data: {
        psychologistId: psychologist.id,
        patientId,
        roomId: roomId || null,
        dateTime: startDateTime,
        endTime: endDateTime,
        status: 'confirmed',
        type: appointmentType || 'presencial',
        notes: notes || null,
      },
    })
  } catch (e) {
    console.error('Error creating appointment:', e)
    return { error: 'Erro ao criar agendamento' }
  }

  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard/calendar')
  return { success: true }
}

export async function cancelAppointment(appointmentId: string, reason?: string) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado' }

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, psychologistId: psychologist.id },
    select: { id: true, slotId: true },
  })

  if (!appointment) {
    return { error: 'Agendamento não encontrado' }
  }

  try {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'cancelled',
        notes: reason ? `Cancelado: ${reason}` : null,
      },
    })
  } catch (e) {
    console.error('Error cancelling appointment:', e)
    return { error: 'Erro ao cancelar agendamento' }
  }

  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard/calendar')
  return { success: true }
}
