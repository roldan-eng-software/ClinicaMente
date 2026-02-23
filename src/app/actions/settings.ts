'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveClinicSettings(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const { data: psychologist } = await supabase
    .from('psychologists')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!psychologist) {
    return { error: 'Psicólogo não encontrado' }
  }

  const clinicName = formData.get('clinicName') as string
  const clinicAddress = formData.get('clinicAddress') as string
  const clinicPhone = formData.get('clinicPhone') as string
  const clinicEmail = formData.get('clinicEmail') as string
  const primaryColor = formData.get('primaryColor') as string
  const secondaryColor = formData.get('secondaryColor') as string
  const sessionDuration = formData.get('sessionDuration') as string
  const eventTypes = formData.getAll('eventTypes') as string[]
  const eventOrder = formData.getAll('eventOrder') as string[]

  const { error } = await supabase
    .from('psychologists')
    .update({
      clinic_name: clinicName || null,
      clinic_address: clinicAddress || null,
      clinic_phone: clinicPhone || null,
      clinic_email: clinicEmail || null,
      primary_color: primaryColor || '#3B82F6',
      secondary_color: secondaryColor || '#10B981',
      session_duration_minutes: sessionDuration ? parseInt(sessionDuration) : 50,
      event_types_to_show: eventTypes.length > 0 ? eventTypes : ['appointment', 'blocked_time'],
      event_card_order: eventOrder.length > 0 ? eventOrder : ['time', 'patient', 'type'],
    })
    .eq('id', psychologist.id)

  if (error) {
    console.error('Error saving clinic settings:', error)
    return { error: 'Erro ao salvar configurações da clínica' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function saveCollaborator(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const { data: psychologist } = await supabase
    .from('psychologists')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!psychologist) {
    return { error: 'Psicólogo não encontrado' }
  }

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

  let error

  if (collaboratorId) {
    const { error: updateError } = await supabase
      .from('collaborators')
      .update({
        full_name: fullName,
        email: email,
        phone: phone || null,
        crp: crp || null,
        specialty: specialty || null,
        bio: bio || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', collaboratorId)
      .eq('psychologist_id', psychologist.id)
    
    error = updateError
  } else {
    const { error: insertError } = await supabase
      .from('collaborators')
      .insert({
        psychologist_id: psychologist.id,
        full_name: fullName,
        email: email,
        phone: phone || null,
        crp: crp || null,
        specialty: specialty || null,
        bio: bio || null,
      })
    
    error = insertError
  }

  if (error) {
    console.error('Error saving collaborator:', error)
    if (error.code === '23505') {
      return { error: 'Já existe um colaborador com este email' }
    }
    return { error: 'Erro ao salvar colaborador' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function deleteCollaborator(collaboratorId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const { data: psychologist } = await supabase
    .from('psychologists')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!psychologist) {
    return { error: 'Psicólogo não encontrado' }
  }

  const { error } = await supabase
    .from('collaborators')
    .delete()
    .eq('id', collaboratorId)
    .eq('psychologist_id', psychologist.id)

  if (error) {
    console.error('Error deleting collaborator:', error)
    return { error: 'Erro ao excluir colaborador' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function saveRoom(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const { data: psychologist } = await supabase
    .from('psychologists')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!psychologist) {
    return { error: 'Psicólogo não encontrado' }
  }

  const name = formData.get('name') as string
  const color = formData.get('color') as string
  const appointmentType = formData.get('appointmentType') as string
  const roomId = formData.get('roomId') as string

  if (!name) {
    return { error: 'Nome da sala é obrigatório' }
  }

  let error

  if (roomId) {
    const { error: updateError } = await supabase
      .from('rooms')
      .update({
        name: name,
        color: color || '#3B82F6',
        appointment_type: appointmentType || 'presencial',
      })
      .eq('id', roomId)
      .eq('psychologist_id', psychologist.id)
    
    error = updateError
  } else {
    const { error: insertError } = await supabase
      .from('rooms')
      .insert({
        psychologist_id: psychologist.id,
        name: name,
        color: color || '#3B82F6',
        appointment_type: appointmentType || 'presencial',
      })
    
    error = insertError
  }

  if (error) {
    console.error('Error saving room:', error)
    return { error: 'Erro ao salvar sala' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function deleteRoom(roomId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const { data: psychologist } = await supabase
    .from('psychologists')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!psychologist) {
    return { error: 'Psicólogo não encontrado' }
  }

  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId)
    .eq('psychologist_id', psychologist.id)

  if (error) {
    console.error('Error deleting room:', error)
    return { error: 'Erro ao excluir sala' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function saveClinicSettingsAdvanced(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const { data: psychologist } = await supabase
    .from('psychologists')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!psychologist) {
    return { error: 'Psicólogo não encontrado' }
  }

  const appointmentTypes = formData.getAll('appointmentTypes') as string[]
  const defaultAppointmentType = formData.get('defaultAppointmentType') as string
  const showPatientPhone = formData.get('showPatientPhone') === 'true'
  const showPatientEmail = formData.get('showPatientEmail') === 'true'
  const requirePatientPhone = formData.get('requirePatientPhone') === 'true'
  const requirePatientEmail = formData.get('requirePatientEmail') === 'true'
  const sendEmailReminder = formData.get('sendEmailReminder') === 'true'
  const reminderHoursBefore = parseInt(formData.get('reminderHoursBefore') as string) || 24

  const { error } = await supabase
    .from('clinic_settings')
    .upsert({
      psychologist_id: psychologist.id,
      appointment_types: appointmentTypes.length > 0 ? appointmentTypes : ['presencial', 'online'],
      default_appointment_type: defaultAppointmentType || 'presencial',
      show_patient_phone: showPatientPhone,
      show_patient_email: showPatientEmail,
      require_patient_phone: requirePatientPhone,
      require_patient_email: requirePatientEmail,
      send_email_reminder: sendEmailReminder,
      reminder_hours_before: reminderHoursBefore,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'psychologist_id' })

  if (error) {
    console.error('Error saving clinic settings:', error)
    return { error: 'Erro ao salvar configurações avançadas' }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
