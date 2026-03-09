'use server'

import { getAuthenticatedPsychologist } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function saveClinicSettings(formData: FormData) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado' }

  const clinicName = formData.get('clinicName') as string
  const clinicAddress = formData.get('clinicAddress') as string
  const clinicPhone = formData.get('clinicPhone') as string
  const clinicEmail = formData.get('clinicEmail') as string
  const primaryColor = formData.get('primaryColor') as string
  const secondaryColor = formData.get('secondaryColor') as string
  const sessionDuration = formData.get('sessionDuration') as string
  const eventTypes = formData.getAll('eventTypes') as string[]
  const eventOrder = formData.getAll('eventOrder') as string[]

  try {
    await prisma.psychologist.update({
      where: { id: psychologist.id },
      data: {
        clinicName: clinicName || null,
        clinicAddress: clinicAddress || null,
        clinicPhone: clinicPhone || null,
        clinicEmail: clinicEmail || null,
        primaryColor: primaryColor || '#3B82F6',
        secondaryColor: secondaryColor || '#10B981',
        sessionDurationMinutes: sessionDuration ? parseInt(sessionDuration) : 50,
        eventTypesToShow: eventTypes.length > 0 ? eventTypes : ['appointment', 'blocked_time'],
        eventCardOrder: eventOrder.length > 0 ? eventOrder : ['time', 'patient', 'type'],
      },
    })
  } catch (e) {
    console.error('Error saving clinic settings:', e)
    return { error: 'Erro ao salvar configurações da clínica' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function saveCollaborator(formData: FormData) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado' }

  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const crp = formData.get('crp') as string
  const specialty = formData.get('specialty') as string
  const bio = formData.get('bio') as string
  const collaboratorId = formData.get('collaboratorId') as string

  if (!fullName || !email) {
    return { error: 'Nome e email são obrigatórios' }
  }

  try {
    if (collaboratorId) {
      await prisma.collaborator.update({
        where: { id: collaboratorId, psychologistId: psychologist.id },
        data: { fullName, email, phone: phone || null, crp: crp || null, specialty: specialty || null, bio: bio || null },
      })
    } else {
      await prisma.collaborator.create({
        data: { psychologistId: psychologist.id, fullName, email, phone: phone || null, crp: crp || null, specialty: specialty || null, bio: bio || null },
      })
    }
  } catch (e: any) {
    console.error('Error saving collaborator:', e)
    if (e?.code === 'P2002') {
      return { error: 'Já existe um colaborador com este email' }
    }
    return { error: 'Erro ao salvar colaborador' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function deleteCollaborator(collaboratorId: string) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado' }

  try {
    await prisma.collaborator.delete({
      where: { id: collaboratorId, psychologistId: psychologist.id },
    })
  } catch (e) {
    console.error('Error deleting collaborator:', e)
    return { error: 'Erro ao excluir colaborador' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function saveRoom(formData: FormData) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado' }

  const name = formData.get('name') as string
  const color = formData.get('color') as string
  const appointmentType = formData.get('appointmentType') as string
  const roomId = formData.get('roomId') as string

  if (!name) return { error: 'Nome da sala é obrigatório' }

  try {
    if (roomId) {
      await prisma.room.update({
        where: { id: roomId, psychologistId: psychologist.id },
        data: { name, color: color || '#3B82F6', appointmentType: appointmentType || 'presencial' },
      })
    } else {
      await prisma.room.create({
        data: { psychologistId: psychologist.id, name, color: color || '#3B82F6', appointmentType: appointmentType || 'presencial' },
      })
    }
  } catch (e) {
    console.error('Error saving room:', e)
    return { error: 'Erro ao salvar sala' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function deleteRoom(roomId: string) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado' }

  try {
    await prisma.room.delete({
      where: { id: roomId, psychologistId: psychologist.id },
    })
  } catch (e) {
    console.error('Error deleting room:', e)
    return { error: 'Erro ao excluir sala' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function saveClinicSettingsAdvanced(formData: FormData) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado' }

  const appointmentTypes = formData.getAll('appointmentTypes') as string[]
  const defaultAppointmentType = formData.get('defaultAppointmentType') as string
  const showPatientPhone = formData.get('showPatientPhone') === 'true'
  const showPatientEmail = formData.get('showPatientEmail') === 'true'
  const requirePatientPhone = formData.get('requirePatientPhone') === 'true'
  const requirePatientEmail = formData.get('requirePatientEmail') === 'true'
  const sendEmailReminder = formData.get('sendEmailReminder') === 'true'
  const reminderHoursBefore = parseInt(formData.get('reminderHoursBefore') as string) || 24

  try {
    await prisma.clinicSettings.upsert({
      where: { psychologistId: psychologist.id },
      update: {
        appointmentTypes: appointmentTypes.length > 0 ? appointmentTypes : ['presencial', 'online'],
        defaultAppointmentType: defaultAppointmentType || 'presencial',
        showPatientPhone,
        showPatientEmail,
        requirePatientPhone,
        requirePatientEmail,
        sendEmailReminder,
        reminderHoursBefore,
      },
      create: {
        psychologistId: psychologist.id,
        appointmentTypes: appointmentTypes.length > 0 ? appointmentTypes : ['presencial', 'online'],
        defaultAppointmentType: defaultAppointmentType || 'presencial',
        showPatientPhone,
        showPatientEmail,
        requirePatientPhone,
        requirePatientEmail,
        sendEmailReminder,
        reminderHoursBefore,
      },
    })
  } catch (e) {
    console.error('Error saving clinic settings:', e)
    return { error: 'Erro ao salvar configurações avançadas' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
