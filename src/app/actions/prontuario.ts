'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createProntuarioSchema = z.object({
  pacienteId: z.string().min(1, 'ID do paciente inválido'),
})

const updateSecaoSchema = z.object({
  prontuarioId: z.string().min(1, 'ID do prontuário inválido'),
  tipoSecao: z.enum([
    'identificacao',
    'anamnese',
    'queixa_principal',
    'historia_clinica',
    'historia_familiar',
    'objetivos_terapeuticos',
    'planejamento_tratamento',
    'evolucao',
    'encerramento',
  ]),
  dados: z.record(z.string(), z.any()),
})

const createSessaoSchema = z.object({
  prontuarioId: z.string().min(1, 'ID do prontuário inválido'),
  dataSessao: z.string().min(1, 'Data da sessão é obrigatória'),
  horaSessao: z.string().optional(),
  duracaoMinutos: z.number().int().min(1).max(180).default(50),
  tipoSessao: z.enum(['presencial', 'online', 'telefonica']).default('presencial'),
  temaPrincipal: z.string().optional(),
  intervencoes: z.string().optional(),
  evolucao: z.string().optional(),
  observacoes: z.string().optional(),
  proximasTarefas: z.string().optional(),
  presenca: z.enum(['compareceu', 'faltou', 'remarcado', 'cancelado']).default('compareceu'),
})

const updateSessaoSchema = z.object({
  sessaoId: z.string().min(1, 'ID da sessão inválido'),
  dataSessao: z.string().optional(),
  horaSessao: z.string().optional(),
  duracaoMinutos: z.number().int().min(1).max(180).optional(),
  tipoSessao: z.enum(['presencial', 'online', 'telefonica']).optional(),
  temaPrincipal: z.string().optional(),
  intervencoes: z.string().optional(),
  evolucao: z.string().optional(),
  observacoes: z.string().optional(),
  proximasTarefas: z.string().optional(),
  presenca: z.enum(['compareceu', 'faltou', 'remarcado', 'cancelado']).optional(),
})

export async function getProntuarios(psychologistId: string) {
  try {
    const data = await prisma.prontuario.findMany({
      where: { psychologistId },
      include: {
        patient: { select: { id: true, fullName: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return { data }
  } catch (e) {
    console.error('Erro ao buscar prontuários:', e)
    return { error: 'Erro ao buscar prontuários' }
  }
}

export async function getProntuarioById(prontuarioId: string, psychologistId: string) {
  try {
    const prontuario = await prisma.prontuario.findFirst({
      where: { id: prontuarioId, psychologistId },
      include: {
        patient: true,
        secoes: { orderBy: { tipoSecao: 'asc' } },
        sessoes: { orderBy: { numeroSessao: 'desc' } },
      },
    })

    if (!prontuario) return { error: 'Prontuário não encontrado' }
    return { data: prontuario }
  } catch (e) {
    return { error: 'Erro ao buscar prontuário' }
  }
}

export async function createProntuario(psychologistId: string, data: z.infer<typeof createProntuarioSchema>) {
  const validation = createProntuarioSchema.safeParse(data)
  if (!validation.success) return { error: validation.error.issues[0].message }

  const { pacienteId } = validation.data

  // Check existing
  const existing = await prisma.prontuario.findFirst({
    where: { patientId: pacienteId, psychologistId },
  })

  if (existing) return { error: 'Já existe um prontuário para este paciente' }

  try {
    const prontuario = await prisma.prontuario.create({
      data: {
        patientId: pacienteId,
        psychologistId,
        status: 'ativo',
      },
    })

    // Create initial sections
    const secoesIniciais = [
      'identificacao', 'anamnese', 'queixa_principal', 'historia_clinica',
      'historia_familiar', 'objetivos_terapeuticos', 'planejamento_tratamento',
      'evolucao', 'encerramento',
    ]

    await prisma.prontuarioSecao.createMany({
      data: secoesIniciais.map(tipo => ({
        prontuarioId: prontuario.id,
        tipoSecao: tipo,
        dadosJson: {},
      })),
    })

    revalidatePath('/dashboard/records')
    return { data: prontuario }
  } catch (e) {
    console.error('Erro ao criar prontuário:', e)
    return { error: 'Erro ao criar prontuário' }
  }
}

export async function updateSecao(
  psychologistId: string,
  userId: string,
  data: z.infer<typeof updateSecaoSchema>
) {
  const validation = updateSecaoSchema.safeParse(data)
  if (!validation.success) return { error: validation.error.issues[0].message }

  const { prontuarioId, tipoSecao, dados } = validation.data

  // Verify ownership
  const prontuario = await prisma.prontuario.findFirst({
    where: { id: prontuarioId, psychologistId },
  })
  if (!prontuario) return { error: 'Prontuário não encontrado ou acesso negado' }

  try {
    const secao = await prisma.prontuarioSecao.upsert({
      where: { prontuarioId_tipoSecao: { prontuarioId, tipoSecao } },
      update: {
        dadosJson: dados,
        dataPreenchimento: new Date(),
        preenchidoPor: userId,
      },
      create: {
        prontuarioId,
        tipoSecao,
        dadosJson: dados,
        dataPreenchimento: new Date(),
        preenchidoPor: userId,
      },
    })

    await prisma.prontuario.update({
      where: { id: prontuarioId },
      data: { updatedAt: new Date() },
    })

    revalidatePath('/dashboard/records')
    return { data: secao }
  } catch (e) {
    console.error('Erro ao atualizar seção:', e)
    return { error: 'Erro ao atualizar seção' }
  }
}

export async function createSessao(
  psychologistId: string,
  userId: string,
  data: z.infer<typeof createSessaoSchema>
) {
  const validation = createSessaoSchema.safeParse(data)
  if (!validation.success) return { error: validation.error.issues[0].message }

  const { prontuarioId, ...sessaoData } = validation.data

  // Verify ownership
  const prontuario = await prisma.prontuario.findFirst({
    where: { id: prontuarioId, psychologistId },
  })
  if (!prontuario) return { error: 'Prontuário não encontrado ou acesso negado' }

  // Get next session number
  const lastSessao = await prisma.sessaoClinica.findFirst({
    where: { prontuarioId },
    orderBy: { numeroSessao: 'desc' },
    select: { numeroSessao: true },
  })

  const proximoNumero = (lastSessao?.numeroSessao || 0) + 1

  try {
    const sessao = await prisma.sessaoClinica.create({
      data: {
        prontuarioId,
        numeroSessao: proximoNumero,
        dataSessao: sessaoData.dataSessao,
        horaSessao: sessaoData.horaSessao,
        duracaoMinutos: sessaoData.duracaoMinutos,
        tipoSessao: sessaoData.tipoSessao,
        temaPrincipal: sessaoData.temaPrincipal,
        intervencoes: sessaoData.intervencoes,
        evolucao: sessaoData.evolucao,
        observacoes: sessaoData.observacoes,
        proximasTarefas: sessaoData.proximasTarefas,
        presenca: sessaoData.presenca,
        registradasPor: userId,
      },
    })

    await prisma.prontuario.update({
      where: { id: prontuarioId },
      data: { updatedAt: new Date() },
    })

    revalidatePath('/dashboard/records')
    return { data: sessao }
  } catch (e) {
    console.error('Erro ao criar sessão:', e)
    return { error: 'Erro ao criar sessão' }
  }
}

export async function updateSessao(
  psychologistId: string,
  data: z.infer<typeof updateSessaoSchema>
) {
  const validation = updateSessaoSchema.safeParse(data)
  if (!validation.success) return { error: validation.error.issues[0].message }

  const { sessaoId, ...updateData } = validation.data

  const sessao = await prisma.sessaoClinica.findUnique({
    where: { id: sessaoId },
    select: { prontuarioId: true },
  })
  if (!sessao) return { error: 'Sessão não encontrada' }

  const prontuario = await prisma.prontuario.findFirst({
    where: { id: sessao.prontuarioId, psychologistId },
  })
  if (!prontuario) return { error: 'Acesso negado' }

  const cleanData = Object.fromEntries(
    Object.entries(updateData).filter(([_, v]) => v !== undefined)
  )

  try {
    const updated = await prisma.sessaoClinica.update({
      where: { id: sessaoId },
      data: cleanData,
    })

    revalidatePath('/dashboard/records')
    return { data: updated }
  } catch (e) {
    console.error('Erro ao atualizar sessão:', e)
    return { error: 'Erro ao atualizar sessão' }
  }
}

export async function deleteSessao(psychologistId: string, sessaoId: string) {
  const sessao = await prisma.sessaoClinica.findUnique({
    where: { id: sessaoId },
    select: { prontuarioId: true },
  })
  if (!sessao) return { error: 'Sessão não encontrada' }

  const prontuario = await prisma.prontuario.findFirst({
    where: { id: sessao.prontuarioId, psychologistId },
  })
  if (!prontuario) return { error: 'Acesso negado' }

  try {
    await prisma.sessaoClinica.delete({ where: { id: sessaoId } })
    revalidatePath('/dashboard/records')
    return { success: true }
  } catch (e) {
    console.error('Erro ao excluir sessão:', e)
    return { error: 'Erro ao excluir sessão' }
  }
}

export async function encerrarProntuario(psychologistId: string, prontuarioId: string) {
  try {
    const prontuario = await prisma.prontuario.updateMany({
      where: { id: prontuarioId, psychologistId },
      data: { status: 'encerrado' },
    })

    revalidatePath('/dashboard/records')
    return { data: prontuario }
  } catch (e) {
    console.error('Erro ao encerrar prontuário:', e)
    return { error: 'Erro ao encerrar prontuário' }
  }
}
