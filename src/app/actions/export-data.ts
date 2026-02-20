'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const exportDataSchema = z.object({
  format: z.enum(['json', 'csv']),
})

export async function exportPatientData(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Usuário não autenticado' }
  }

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!patient) {
    return { error: 'Paciente não encontrado' }
  }

  const [appointments, payments, consentLogs] = await Promise.all([
    supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        psychologists:psychologists(id, full_name, crp)
      `)
      .eq('patient_id', patient.id)
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('payments')
      .select('*')
      .eq('patient_id', patient.id)
      .order('paid_at', { ascending: false }),
    supabase
      .from('consent_logs')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false })
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    patient: {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      cpf: patient.cpf,
      date_of_birth: patient.date_of_birth,
      address: patient.address,
      created_at: patient.created_at,
    },
    appointments: appointments.data?.map(apt => ({
      id: apt.id,
      scheduled_at: apt.scheduled_at,
      status: apt.status,
      psychologist_name: apt.psychologists?.[0]?.full_name,
      psychologist_crp: apt.psychologists?.[0]?.crp,
    })) || [],
    payments: payments.data?.map(pay => ({
      id: pay.id,
      amount: pay.amount,
      currency: 'BRL',
      status: pay.status,
      payment_method: pay.payment_method,
      paid_at: pay.paid_at,
    })) || [],
    consent_logs: consentLogs.data?.map(log => ({
      id: log.id,
      consent_type: log.consent_type,
      consent_version: log.consent_version,
      granted: log.granted,
      ip_address: log.ip_address,
      created_at: log.created_at,
    })) || [],
    clinical_notes: {
      available: false,
      message: 'Os prontuários clínicos estão sob custódia do psicólogo responsável. Para solicitar acesso, entre em contato direto com o profissional.'
    },
    lgpd_notice: {
      law: 'Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018',
      rights: [
        'Acesso aos dados pessoais',
        'Portabilidade dos dados',
        'Anonimização ou exclusão de dados',
        'Revogação de consentimento'
      ],
      data_controller: 'ClínicaMente - CNPJ: A ser informado',
      contact: 'privacidade@clinicamente.app'
    }
  }

  return { 
    success: true, 
    data: exportData 
  }
}
