'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const exportDataSchema = z.object({
  format: z.enum(['json', 'csv']),
})

export async function exportPatientData(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Usuário não autenticado' }

  // Find patient by user (patient-facing export)
  const patient = await prisma.patient.findFirst({
    where: { email: session.user.email || '' },
  })

  if (!patient) return { error: 'Paciente não encontrado' }

  const [appointments, payments, consentLogs] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: { psychologist: { select: { id: true, fullName: true, crp: true } } },
      orderBy: { dateTime: 'desc' },
    }),
    prisma.payment.findMany({
      where: { patientId: patient.id },
      orderBy: { paidAt: 'desc' },
    }),
    prisma.consentLog.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    patient: {
      id: patient.id,
      name: patient.fullName,
      email: patient.email,
      phone: patient.phone,
      cpf: patient.cpf,
      date_of_birth: patient.birthDate,
      created_at: patient.createdAt,
    },
    appointments: appointments.map(apt => ({
      id: apt.id,
      scheduled_at: apt.dateTime,
      status: apt.status,
      psychologist_name: apt.psychologist.fullName,
      psychologist_crp: apt.psychologist.crp,
    })),
    payments: payments.map(pay => ({
      id: pay.id,
      amount: pay.amount,
      currency: 'BRL',
      status: pay.status,
      payment_method: pay.method,
      paid_at: pay.paidAt,
    })),
    consent_logs: consentLogs.map(log => ({
      id: log.id,
      consent_type: log.consentType,
      granted: log.granted,
      ip_address: log.ipAddress,
      created_at: log.createdAt,
    })),
    clinical_notes: {
      available: false,
      message: 'Os prontuários clínicos estão sob custódia do psicólogo responsável. Para solicitar acesso, entre em contato direto com o profissional.',
    },
    lgpd_notice: {
      law: 'Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018',
      rights: [
        'Acesso aos dados pessoais',
        'Portabilidade dos dados',
        'Anonimização ou exclusão de dados',
        'Revogação de consentimento',
      ],
      data_controller: 'ClínicaMente - CNPJ: A ser informado',
      contact: 'privacidade@clinicamente.app',
    },
  }

  return { success: true, data: exportData }
}
