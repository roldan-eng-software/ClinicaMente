'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createManualAppointment(formData: FormData) {
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

  const patientId = formData.get('patientId') as string
  const date = formData.get('date') as string
  const time = formData.get('time') as string
  const roomId = formData.get('roomId') as string
  const appointmentType = formData.get('appointmentType') as string
  const collaboratorId = formData.get('collaboratorId') as string
  const notes = formData.get('notes') as string

  if (!patientId || !date || !time) {
    return { error: 'Preencha todos os campos obrigatórios' }
  }

  const sessionDuration = psychologist.session_duration_minutes || 50
  
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  const startDateTime = new Date(year, month - 1, day, hours, minutes)
  const endDateTime = new Date(startDateTime.getTime() + sessionDuration * 60000)

  const { data: existingSlot } = await supabase
    .from('slots')
    .select('id, status')
    .eq('psychologist_id', psychologist.id)
    .gte('start_at', startDateTime.toISOString())
    .lt('start_at', endDateTime.toISOString())
    .maybeSingle()

  let slotId: string

  if (existingSlot) {
    if (existingSlot.status !== 'available') {
      return { error: 'Este horário já está ocupado' }
    }
    slotId = existingSlot.id
    
    const { error: slotUpdateError } = await supabase
      .from('slots')
      .update({ 
        status: 'confirmed',
        room_id: roomId || null,
        appointment_type: appointmentType || 'presencial'
      })
      .eq('id', slotId)

    if (slotUpdateError) {
      console.error('Error updating slot:', slotUpdateError)
      return { error: 'Erro ao atualizar horário' }
    }
  } else {
    const { data: newSlot, error: slotError } = await supabase
      .from('slots')
      .insert({
        psychologist_id: psychologist.id,
        start_at: startDateTime.toISOString(),
        end_at: endDateTime.toISOString(),
        status: 'confirmed',
        room_id: roomId || null,
        appointment_type: appointmentType || 'presencial'
      })
      .select()
      .single()

    if (slotError) {
      console.error('Error creating slot:', slotError)
      return { error: 'Erro ao criar horário' }
    }

    slotId = newSlot.id
  }

  const { data: psychologistData } = await supabase
    .from('psychologists')
    .select('default_session_price')
    .eq('id', psychologist.id)
    .single()

  const { error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      psychologist_id: psychologist.id,
      patient_id: patientId,
      slot_id: slotId,
      status: 'confirmed',
      payment_status: 'pending',
      session_price: psychologistData?.default_session_price || 15000,
      notes_pre: notes || null,
      collaborator_id: collaboratorId || null,
    })

  if (appointmentError) {
    console.error('Error creating appointment:', appointmentError)
    return { error: 'Erro ao criar agendamento' }
  }

  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard/calendar')
  return { success: true }
}

export async function cancelAppointment(appointmentId: string, reason?: string) {
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

  const { data: appointment } = await supabase
    .from('appointments')
    .select('slot_id')
    .eq('id', appointmentId)
    .eq('psychologist_id', psychologist.id)
    .single()

  if (!appointment) {
    return { error: 'Agendamento não encontrado' }
  }

  const { error: appointmentError } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      cancellation_reason: reason || null,
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'psychologist'
    })
    .eq('id', appointmentId)

  if (appointmentError) {
    console.error('Error cancelling appointment:', appointmentError)
    return { error: 'Erro ao cancelar agendamento' }
  }

  if (appointment.slot_id) {
    await supabase
      .from('slots')
      .update({ status: 'available' })
      .eq('id', appointment.slot_id)
  }

  revalidatePath('/dashboard/schedule')
  revalidatePath('/dashboard/calendar')
  return { success: true }
}
