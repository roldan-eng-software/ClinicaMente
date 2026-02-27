'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createProntuarioSchema = z.object({
  pacienteId: z.string().uuid('ID do paciente inválido'),
})

const updateSecaoSchema = z.object({
  prontuarioId: z.string().uuid('ID do prontuário inválido'),
  tipoSecao: z.enum([
    'identificacao',
    'anamnese',
    'queixa_principal',
    'historia_clinica',
    'historia_familiar',
    'objetivos_terapeuticos',
    'planejamento_tratamento',
    'evolucao',
    'encerramento'
  ]),
  dados: z.record(z.string(), z.any()),
})

const createSessaoSchema = z.object({
  prontuarioId: z.string().uuid('ID do prontuário inválido'),
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
  sessaoId: z.string().uuid('ID da sessão inválido'),
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
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('prontuarios')
    .select(`
      id,
      status,
      data_criacao,
      data_atualizacao,
      versao,
      paciente:patients(
        id,
        full_name,
        email,
        phone
      )
    `)
    .eq('psicologo_id', psychologistId)
    .order('data_criacao', { ascending: false })

  if (error) {
    console.error('Erro ao buscar prontuários:', error)
    return { error: 'Erro ao buscar prontuários' }
  }

  return { data }
}

export async function getProntuarioById(prontuarioId: string, psychologistId: string) {
  const supabase = await createClient()

  const { data: prontuario, error } = await supabase
    .from('prontuarios')
    .select(`
      id,
      status,
      data_criacao,
      data_atualizacao,
      versao,
      paciente:patients(
        id,
        full_name,
        email,
        phone,
        cpf,
        date_of_birth,
        address,
        emergency_contact,
        emergency_phone
      )
    `)
    .eq('id', prontuarioId)
    .eq('psicologo_id', psychologistId)
    .single()

  if (error || !prontuario) {
    return { error: 'Prontuário não encontrado' }
  }

  const { data: secoes } = await supabase
    .from('prontuario_secoes')
    .select('*')
    .eq('prontuario_id', prontuarioId)
    .order('tipo_secao')

  const { data: sessoes } = await supabase
    .from('sessoes_clinicas')
    .select('*')
    .eq('prontuario_id', prontuarioId)
    .order('numero_sessao', { ascending: false })

  return {
    data: {
      ...prontuario,
      secoes: secoes || [],
      sessoes: sessoes || [],
    }
  }
}

export async function createProntuario(psychologistId: string, data: z.infer<typeof createProntuarioSchema>) {
  const supabase = await createClient()

  const validation = createProntuarioSchema.safeParse(data)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const { pacienteId } = validation.data

  const { data: existing, error: checkError } = await supabase
    .from('prontuarios')
    .select('id')
    .eq('paciente_id', pacienteId)
    .eq('psicologo_id', psychologistId)
    .maybeSingle()

  if (checkError) {
    console.error('Erro ao verificar prontuário existente:', checkError)
    return { error: 'Erro ao verificar prontuário' }
  }

  if (existing) {
    return { error: 'Já existe um prontuário para este paciente' }
  }

  const { data: prontuario, error } = await supabase
    .from('prontuarios')
    .insert({
      paciente_id: pacienteId,
      psicologo_id: psychologistId,
      status: 'ativo',
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar prontuário:', error)
    return { error: 'Erro ao criar prontuário' }
  }

  const secoesIniciais = [
    'identificacao',
    'anamnese',
    'queixa_principal',
    'historia_clinica',
    'historia_familiar',
    'objetivos_terapeuticos',
    'planejamento_tratamento',
    'evolucao',
    'encerramento'
  ]

  const secoesData = secoesIniciais.map(tipo => ({
    prontuario_id: prontuario.id,
    tipo_secao: tipo,
    dados_json: {},
  }))

  const { error: secoesError } = await supabase
    .from('prontuario_secoes')
    .insert(secoesData)

  if (secoesError) {
    console.error('Erro ao criar seções:', secoesError)
  }

  revalidatePath('/dashboard/records')
  return { data: prontuario }
}

export async function updateSecao(
  psychologistId: string,
  userId: string,
  data: z.infer<typeof updateSecaoSchema>
) {
  const supabase = await createClient()

  const validation = updateSecaoSchema.safeParse(data)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const { prontuarioId, tipoSecao, dados } = validation.data

  const { data: prontuario, error: checkError } = await supabase
    .from('prontuarios')
    .select('id')
    .eq('id', prontuarioId)
    .eq('psicologo_id', psychologistId)
    .single()

  if (checkError || !prontuario) {
    return { error: 'Prontuário não encontrado ou acesso negado' }
  }

  const { data: secao, error } = await supabase
    .from('prontuario_secoes')
    .upsert({
      prontuario_id: prontuarioId,
      tipo_secao: tipoSecao,
      dados_json: dados,
      data_preenchimento: new Date().toISOString(),
      preenchido_por: userId,
      versao_registro: 1,
    }, {
      onConflict: 'prontuario_id,tipo_secao'
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar seção:', error)
    return { error: 'Erro ao atualizar seção' }
  }

  await supabase
    .from('prontuarios')
    .update({
      data_atualizacao: new Date().toISOString(),
    })
    .eq('id', prontuarioId)

  revalidatePath('/dashboard/records')
  return { data: secao }
}

export async function createSessao(
  psychologistId: string,
  userId: string,
  data: z.infer<typeof createSessaoSchema>
) {
  const supabase = await createClient()

  const validation = createSessaoSchema.safeParse(data)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const { prontuarioId, dataSessao, horaSessao, duracaoMinutos, tipoSessao, temaPrincipal, intervencoes, evolucao, observacoes, proximasTarefas, presenca } = validation.data

  const { data: prontuario, error: checkError } = await supabase
    .from('prontuarios')
    .select('id')
    .eq('id', prontuarioId)
    .eq('psicologo_id', psychologistId)
    .single()

  if (checkError || !prontuario) {
    return { error: 'Prontuário não encontrado ou acesso negado' }
  }

  const { data: ultimo } = await supabase
    .from('sessoes_clinicas')
    .select('numero_sessao')
    .eq('prontuario_id', prontuarioId)
    .order('numero_sessao', { ascending: false })
    .limit(1)
    .single()

  const proximoNumero = (ultimo?.numero_sessao || 0) + 1

  const { data: sessao, error } = await supabase
    .from('sessoes_clinicas')
    .insert({
      prontuario_id: prontuarioId,
      numero_sessao: proximoNumero,
      data_sessao: dataSessao,
      hora_sessao: horaSessao,
      duracao_minutos: duracaoMinutos,
      tipo_sessao: tipoSessao,
      tema_principal: temaPrincipal,
      intervencoes: intervencoes,
      evolucao: evolucao,
      observacoes: observacoes,
      proximas_tarefas: proximasTarefas,
      presenca: presenca,
      registradas_por: userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar sessão:', error)
    return { error: 'Erro ao criar sessão' }
  }

  await supabase
    .from('prontuarios')
    .update({
      data_atualizacao: new Date().toISOString(),
    })
    .eq('id', prontuarioId)

  revalidatePath('/dashboard/records')
  return { data: sessao }
}

export async function updateSessao(
  psychologistId: string,
  data: z.infer<typeof updateSessaoSchema>
) {
  const supabase = await createClient()

  const validation = updateSessaoSchema.safeParse(data)
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const { sessaoId, ...updateData } = validation.data

  const { data: sessao, error: checkError } = await supabase
    .from('sessoes_clinicas')
    .select('prontuario_id')
    .eq('id', sessaoId)
    .single()

  if (checkError || !sessao) {
    return { error: 'Sessão não encontrada' }
  }

  const { data: prontuario } = await supabase
    .from('prontuarios')
    .select('id')
    .eq('id', sessao.prontuario_id)
    .eq('psicologo_id', psychologistId)
    .single()

  if (!prontuario) {
    return { error: 'Acesso negado' }
  }

  const cleanData = Object.fromEntries(
    Object.entries(updateData).filter(([_, v]) => v !== undefined)
  )

  const { data: sessaoAtualizada, error } = await supabase
    .from('sessoes_clinicas')
    .update(cleanData)
    .eq('id', sessaoId)
    .select()
    .single()

  if (error) {
    console.error('Erro ao atualizar sessão:', error)
    return { error: 'Erro ao atualizar sessão' }
  }

  revalidatePath('/dashboard/records')
  return { data: sessaoAtualizada }
}

export async function deleteSessao(psychologistId: string, sessaoId: string) {
  const supabase = await createClient()

  const { data: sessao, error: checkError } = await supabase
    .from('sessoes_clinicas')
    .select('prontuario_id')
    .eq('id', sessaoId)
    .single()

  if (checkError || !sessao) {
    return { error: 'Sessão não encontrada' }
  }

  const { data: prontuario } = await supabase
    .from('prontuarios')
    .select('id')
    .eq('id', sessao.prontuario_id)
    .eq('psicologo_id', psychologistId)
    .single()

  if (!prontuario) {
    return { error: 'Acesso negado' }
  }

  const { error } = await supabase
    .from('sessoes_clinicas')
    .delete()
    .eq('id', sessaoId)

  if (error) {
    console.error('Erro ao excluir sessão:', error)
    return { error: 'Erro ao excluir sessão' }
  }

  revalidatePath('/dashboard/records')
  return { success: true }
}

export async function encerrarProntuario(psychologistId: string, prontuarioId: string) {
  const supabase = await createClient()

  const { data: prontuario, error } = await supabase
    .from('prontuarios')
    .update({ status: 'encerrado' })
    .eq('id', prontuarioId)
    .eq('psicologo_id', psychologistId)
    .select()
    .single()

  if (error) {
    console.error('Erro ao encerrar prontuário:', error)
    return { error: 'Erro ao encerrar prontuário' }
  }

  revalidatePath('/dashboard/records')
  return { data: prontuario }
}
