'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { headers } from 'next/headers'

const deletionRequestSchema = z.object({
  requestType: z.enum(['anonymize', 'delete']),
  reason: z.string().optional(),
})

const EMAIL_API_KEY = process.env.EMAIL_API_KEY || ''
const PLATFORM_EMAIL = 'contato@clinicamente.app'

export async function createDeletionRequest(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const rawData = {
    requestType: formData.get('requestType'),
    reason: formData.get('reason'),
  }

  const validated = deletionRequestSchema.safeParse(rawData)

  if (!validated.success) {
    return { error: 'Dados inválidos' }
  }

  const { requestType, reason } = validated.data

  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, psychologist_id, email, name')
    .eq('user_id', user.id)
    .single()

  if (patientError || !patient) {
    return { error: 'Paciente não encontrado' }
  }

  const { data: psychologist } = await supabase
    .from('psychologists')
    .select('id, full_name, email')
    .eq('id', patient.psychologist_id)
    .single()

  const { error: insertError } = await supabase
    .from('data_deletion_requests')
    .insert({
      patient_id: patient.id,
      psychologist_id: patient.psychologist_id,
      request_type: requestType,
      reason: reason || null,
      status: 'pending',
    })

  if (insertError) {
    console.error('Error creating deletion request:', insertError)
    return { error: 'Erro ao criar solicitação. Tente novamente.' }
  }

  if (EMAIL_API_KEY) {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    const emailSubject = `Nova solicitação de exclusão de dados - ${patient.name}`
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Nova solicitação de exclusão de dados</h2>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Paciente:</strong> ${patient.name}</p>
          <p><strong>Email:</strong> ${patient.email}</p>
          <p><strong>Tipo de solicitação:</strong> ${requestType === 'anonymize' ? 'Anonimização' : 'Exclusão total'}</p>
          ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
          <p><strong>Psicólogo:</strong> ${psychologist?.full_name || 'N/A'}</p>
          <p><strong>IP:</strong> ${ip}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        
        <p>Acesse o painel de administração para processar esta solicitação.</p>
      </div>
    `

    try {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${EMAIL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            { to: [{ email: PLATFORM_EMAIL }] }
          ],
          from: { email: 'noreply@clinicamente.app', name: 'ClínicaMente' },
          subject: emailSubject,
          content: [{ type: 'text/html', value: emailBody }],
        }),
      })
    } catch (err) {
      console.error('Error sending notification email:', err)
    }

    if (psychologist?.email) {
      const psychologistEmailSubject = `Solicitação de exclusão de dados - Paciente ${patient.name}`
      const psychologistEmailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Solicitação de exclusão de dados</h2>
          
          <p>Um paciente solicitou a ${requestType === 'anonymize' ? 'anonimização' : 'exclusão'} dos seus dados.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Paciente:</strong> ${patient.name}</p>
            <p><strong>Tipo de solicitação:</strong> ${requestType === 'anonymize' ? 'Anonimização' : 'Exclusão total'}</p>
            ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
          </div>
          
          <p>Você pode precisar processar esta solicitação conforme a LGPD.</p>
        </div>
      `

      try {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${EMAIL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [
              { to: [{ email: psychologist.email }] }
            ],
            from: { email: 'noreply@clinicamente.app', name: 'ClínicaMente' },
            subject: psychologistEmailSubject,
            content: [{ type: 'text/html', value: psychologistEmailBody }],
          }),
        })
      } catch (err) {
        console.error('Error sending psychologist notification:', err)
      }
    }
  }

  return { success: true }
}

export async function completeDeletionRequest(
  requestId: string,
  status: 'completed' | 'partially_completed',
  notes: string
) {
  const supabase = await createClient()

  const { data: request } = await supabase
    .from('data_deletion_requests')
    .select('patient_id, psychologist_id, request_type')
    .eq('id', requestId)
    .single()

  if (!request) {
    return { error: 'Solicitação não encontrada' }
  }

  await supabase
    .from('data_deletion_requests')
    .update({
      status,
      notes,
      completed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  const { data: patient } = await supabase
    .from('patients')
    .select('email, name')
    .eq('id', request.patient_id)
    .single()

  if (patient && EMAIL_API_KEY) {
    const emailSubject = status === 'completed' 
      ? 'Sua solicitação de exclusão de dados foi processada'
      : 'Sua solicitação de exclusão de dados foi parcialmente processada'
    
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Status da solicitação de exclusão</h2>
        
        <p>Olá, ${patient.name}!</p>
        
        <p>Sua solicitação de ${request.request_type === 'anonymize' ? 'anonimização' : 'exclusão'} de dados foi processada.</p>
        
        ${status === 'partially_completed' ? `
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Observações:</strong></p>
            <p>${notes}</p>
          </div>
        ` : ''}
        
        <p>Alguns dados podem ser mantidos por obrigação legal (ex: registros fiscais).</p>
        
        <p>Em caso de dúvidas, entre em contato conosco.</p>
      </div>
    `

    try {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${EMAIL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            { to: [{ email: patient.email }] }
          ],
          from: { email: 'noreply@clinicamente.app', name: 'ClínicaMente' },
          subject: emailSubject,
          content: [{ type: 'text/html', value: emailBody }],
        }),
      })
    } catch (err) {
      console.error('Error sending completion email:', err)
    }
  }

  return { success: true }
}
