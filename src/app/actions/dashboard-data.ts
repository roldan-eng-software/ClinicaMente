'use server'

import { getAuthenticatedPsychologist } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ===== Upcoming Sessions =====
export async function getUpcomingSessions() {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado', data: [] }

  const now = new Date()
  const data = await prisma.appointment.findMany({
    where: {
      psychologistId: psychologist.id,
      dateTime: { gte: now },
      status: { in: ['scheduled', 'confirmed'] },
    },
    include: {
      patient: { select: { fullName: true, email: true, phone: true } },
      room: { select: { name: true, color: true } },
    },
    orderBy: { dateTime: 'asc' },
    take: 10,
  })

  return { data }
}

// ===== Financial Summary =====
export async function getFinancialSummary() {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado', data: null }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [payments, pendingPayments, expenses, appointmentsCount] = await Promise.all([
    prisma.payment.findMany({
      where: { psychologistId: psychologist.id, status: 'paid', paidAt: { gte: startOfMonth, lte: endOfMonth } },
    }),
    prisma.payment.findMany({
      where: { psychologistId: psychologist.id, status: 'pending' },
    }),
    prisma.expense.findMany({
      where: { psychologistId: psychologist.id, date: { gte: startOfMonth, lte: endOfMonth } },
    }),
    prisma.appointment.count({
      where: { psychologistId: psychologist.id, dateTime: { gte: startOfMonth, lte: endOfMonth }, status: { not: 'cancelled' } },
    }),
  ])

  const totalReceived = payments.reduce((acc: number, p: any) => acc + p.amount, 0)
  const totalPending = pendingPayments.reduce((acc: number, p: any) => acc + p.amount, 0)
  const totalExpenses = expenses.reduce((acc: number, e: any) => acc + e.amount, 0)

  return {
    data: {
      totalReceived,
      totalPending,
      totalExpenses,
      netProfit: totalReceived - totalExpenses,
      appointmentsCount,
    },
  }
}

// ===== Financial Report =====
export async function getFinancialReport(startDate?: string, endDate?: string) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado', data: null }

  const now = new Date()
  const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1)
  const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({
      where: { psychologistId: psychologist.id, createdAt: { gte: start, lte: end } },
      include: { patient: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.expense.findMany({
      where: { psychologistId: psychologist.id, date: { gte: start, lte: end } },
      orderBy: { date: 'desc' },
    }),
  ])

  return { data: { payments, expenses } }
}

// ===== Pendencies =====
export async function getPendencies() {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado', data: null }

  const now = new Date()
  const [pendingPayments, upcomingAppointments, recentPatients] = await Promise.all([
    prisma.payment.count({
      where: { psychologistId: psychologist.id, status: 'pending' },
    }),
    prisma.appointment.count({
      where: { psychologistId: psychologist.id, dateTime: { gte: now }, status: { in: ['scheduled', 'confirmed'] } },
    }),
    prisma.patient.count({
      where: { psychologistId: psychologist.id, active: true },
    }),
  ])

  return {
    data: {
      pendingPayments,
      upcomingAppointments,
      activePatients: recentPatients,
    },
  }
}

// ===== Tasks =====
export async function getTasks() {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado', data: [] }

  const data = await prisma.task.findMany({
    where: { psychologistId: psychologist.id },
    orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
    take: 20,
  })

  return { data }
}

export async function createTask(title: string) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado' }

  await prisma.task.create({
    data: { psychologistId: psychologist.id, title },
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function toggleTask(taskId: string) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado' }

  const task = await prisma.task.findFirst({
    where: { id: taskId, psychologistId: psychologist.id },
  })
  if (!task) return { error: 'Tarefa não encontrada' }

  await prisma.task.update({
    where: { id: taskId },
    data: { completed: !task.completed },
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteTask(taskId: string) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Psicólogo não encontrado' }

  await prisma.task.delete({
    where: { id: taskId, psychologistId: psychologist.id },
  })

  revalidatePath('/dashboard')
  return { success: true }
}

// ===== Dashboard Page Data =====
export async function getDashboardData() {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Não autenticado' }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [patientsCount, appointmentsThisMonth, upcomingSessions] = await Promise.all([
    prisma.patient.count({ where: { psychologistId: psychologist.id, active: true } }),
    prisma.appointment.count({
      where: { psychologistId: psychologist.id, dateTime: { gte: startOfMonth }, status: { not: 'cancelled' } },
    }),
    prisma.appointment.findMany({
      where: { psychologistId: psychologist.id, dateTime: { gte: now }, status: { in: ['scheduled', 'confirmed'] } },
      include: { patient: { select: { fullName: true } } },
      orderBy: { dateTime: 'asc' },
      take: 5,
    }),
  ])

  return {
    psychologist,
    patientsCount,
    appointmentsThisMonth,
    upcomingSessions,
  }
}

// ===== Settings Data =====
export async function getSettingsData() {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Não autenticado' }

  const [collaborators, rooms, clinicSettings] = await Promise.all([
    prisma.collaborator.findMany({ where: { psychologistId: psychologist.id } }),
    prisma.room.findMany({ where: { psychologistId: psychologist.id } }),
    prisma.clinicSettings.findUnique({ where: { psychologistId: psychologist.id } }),
  ])

  return { psychologist, collaborators, rooms, clinicSettings }
}

// ===== Patients Data =====
export async function getPatients() {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Não autenticado', data: [] }

  const data = await prisma.patient.findMany({
    where: { psychologistId: psychologist.id },
    orderBy: { fullName: 'asc' },
  })

  return { data }
}

export async function getPatientById(patientId: string) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Não autenticado', data: null }

  const data = await prisma.patient.findFirst({
    where: { id: patientId, psychologistId: psychologist.id },
    include: {
      appointments: { orderBy: { dateTime: 'desc' }, take: 10 },
      payments: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })

  return { data }
}

export async function createPatient(formData: FormData) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Não autenticado' }

  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const cpf = formData.get('cpf') as string
  const birthDate = formData.get('birthDate') as string
  const notes = formData.get('notes') as string

  if (!fullName) return { error: 'Nome é obrigatório' }

  try {
    await prisma.patient.create({
      data: {
        psychologistId: psychologist.id,
        fullName,
        email: email || null,
        phone: phone || null,
        cpf: cpf || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        notes: notes || null,
      },
    })
  } catch (e: any) {
    return { error: e.message || 'Erro ao criar paciente' }
  }

  revalidatePath('/dashboard/patients')
  return { success: true }
}

export async function updatePatient(patientId: string, formData: FormData) {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Não autenticado' }

  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const cpf = formData.get('cpf') as string
  const birthDate = formData.get('birthDate') as string
  const notes = formData.get('notes') as string

  try {
    await prisma.patient.update({
      where: { id: patientId, psychologistId: psychologist.id },
      data: {
        fullName: fullName || undefined,
        email: email || null,
        phone: phone || null,
        cpf: cpf || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        notes: notes || null,
      },
    })
  } catch (e: any) {
    return { error: e.message || 'Erro ao atualizar paciente' }
  }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}

// ===== Schedule Data =====
export async function getScheduleData() {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Não autenticado', data: null }

  const appointments = await prisma.appointment.findMany({
    where: { psychologistId: psychologist.id },
    include: {
      patient: { select: { fullName: true, email: true, phone: true } },
      room: { select: { name: true, color: true } },
    },
    orderBy: { dateTime: 'asc' },
  })

  const rooms = await prisma.room.findMany({
    where: { psychologistId: psychologist.id },
  })

  return { data: { appointments, rooms, psychologist } }
}

// ===== Calendar Data =====
export async function getCalendarData() {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Não autenticado', data: null }

  const [appointments, blockedTimes, slots] = await Promise.all([
    prisma.appointment.findMany({
      where: { psychologistId: psychologist.id },
      include: {
        patient: { select: { fullName: true } },
        room: { select: { name: true, color: true } },
      },
    }),
    prisma.blockedTime.findMany({
      where: { psychologistId: psychologist.id },
    }),
    prisma.slot.findMany({
      where: { psychologistId: psychologist.id, isActive: true },
    }),
  ])

  return { data: { appointments, blockedTimes, slots, psychologist } }
}

// ===== Availability Data =====
export async function getAvailabilityData() {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Não autenticado', data: null }

  const [rules, rooms, slots] = await Promise.all([
    prisma.availabilityRule.findMany({
      where: { psychologistId: psychologist.id },
      orderBy: { dayOfWeek: 'asc' },
    }),
    prisma.room.findMany({
      where: { psychologistId: psychologist.id },
    }),
    prisma.slot.findMany({
      where: { psychologistId: psychologist.id, isActive: true },
    }),
  ])

  return { data: { rules, rooms, slots, psychologist } }
}

// ===== Records Data =====
export async function getRecordsData() {
  const { error, psychologist } = await getAuthenticatedPsychologist()
  if (error || !psychologist) return { error: error || 'Não autenticado', data: null }

  const prontuarios = await prisma.prontuario.findMany({
    where: { psychologistId: psychologist.id },
    include: {
      patient: { select: { fullName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return { data: { prontuarios, psychologist } }
}
