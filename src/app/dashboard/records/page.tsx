'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePsychologist } from '../context'

interface Paciente {
  id: string
  full_name: string
  email: string
  phone?: string
}

interface Prontuario {
  id: string
  status: 'ativo' | 'encerrado' | 'suspenso'
  data_criacao: string
  data_atualizacao: string
  versao: number
  paciente: Paciente
}

interface Secao {
  id: string
  tipo_secao: string
  dados_json: Record<string, any>
  data_preenchimento: string | null
}

interface Sessao {
  id: string
  numero_sessao: number
  data_sessao: string
  hora_sessao?: string
  duracao_minutos: number
  tipo_sessao: 'presencial' | 'online' | 'telefonica'
  tema_principal?: string
  intervencoes?: string
  evolucao?: string
  observacoes?: string
  proximas_tarefas?: string
  presenca: 'compareceu' | 'faltou' | 'remarcado' | 'cancelado'
  data_registro: string
}

type SecaoTipo = 
  | 'identificacao'
  | 'anamnese'
  | 'queixa_principal'
  | 'historia_clinica'
  | 'historia_familiar'
  | 'objetivos_terapeuticos'
  | 'planejamento_tratamento'
  | 'evolucao'
  | 'encerramento'

const SECOES_LABELS: Record<SecaoTipo, string> = {
  identificacao: 'Identificação',
  anamnese: 'Anamnese',
  queixa_principal: 'Queixa Principal',
  historia_clinica: 'História Clínica',
  historia_familiar: 'História Familiar',
  objetivos_terapeuticos: 'Objetivos Terapêuticos',
  planejamento_tratamento: 'Planejamento do Tratamento',
  evolucao: 'Evolução',
  encerramento: 'Encerramento'
}

export default function RecordsPage() {
  const psychologist = usePsychologist()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [prontuarios, setProntuarios] = useState<Prontuario[]>([])
  const [selectedProntuario, setSelectedProntuario] = useState<Prontuario | null>(null)
  const [secoes, setSecoes] = useState<Secao[]>([])
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [activeTab, setActiveTab] = useState<'dados' | 'sessoes'>('dados')
  const [activeSecao, setActiveSecao] = useState<SecaoTipo>('identificacao')
  const [patients, setPatients] = useState<Paciente[]>([])
  const [showNewProntuario, setShowNewProntuario] = useState(false)
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showSessaoModal, setShowSessaoModal] = useState(false)
  const [editingSessao, setEditingSessao] = useState<Sessao | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const [sessaoForm, setSessaoForm] = useState({
    dataSessao: '',
    horaSessao: '',
    duracaoMinutos: 50,
    tipoSessao: 'presencial' as const,
    temaPrincipal: '',
    intervencoes: '',
    evolucao: '',
    observacoes: '',
    proximasTarefas: '',
    presenca: 'compareceu' as const
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    
    const [prontuariosRes, patientsRes] = await Promise.all([
      supabase
        .from('prontuarios')
        .select(`
          id,
          status,
          data_criacao,
          data_atualizacao,
          versao,
          paciente:patients(id, full_name, email, phone)
        `)
        .eq('psicologo_id', psychologist.id)
        .order('data_criacao', { ascending: false }),
      supabase
        .from('patients')
        .select('id, full_name, email, phone')
        .eq('psychologist_id', psychologist.id)
        .eq('is_active', true)
        .order('full_name')
    ])

    if (prontuariosRes.data) {
      setProntuarios(prontuariosRes.data.map((p: any) => ({
        ...p,
        paciente: p.paciente?.[0] || p.paciente
      })))
    }

    if (patientsRes.data) {
      setPatients(patientsRes.data)
    }

    setLoading(false)
  }

  async function loadProntuarioDetails(prontuarioId: string) {
    const [secoesRes, sessoesRes] = await Promise.all([
      supabase
        .from('prontuario_secoes')
        .select('*')
        .eq('prontuario_id', prontuarioId)
        .order('tipo_secao'),
      supabase
        .from('sessoes_clinicas')
        .select('*')
        .eq('prontuario_id', prontuarioId)
        .order('numero_sessao', { ascending: false })
    ])

    if (secoesRes.data) {
      setSecoes(secoesRes.data)
    }

    if (sessoesRes.data) {
      setSessoes(sessoesRes.data)
    }
  }

  async function createProntuario() {
    if (!selectedPatientId) return

    setSaving(true)

    const existingProntuario = prontuarios.find(
      p => p.paciente.id === selectedPatientId
    )

    if (existingProntuario) {
      alert('Já existe um prontuário para este paciente')
      setSaving(false)
      return
    }

    const { data, error } = await supabase
      .from('prontuarios')
      .insert({
        paciente_id: selectedPatientId,
        psicologo_id: psychologist.id,
        status: 'ativo'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar prontuário:', error)
      alert('Erro ao criar prontuário')
      setSaving(false)
      return
    }

    const secoesIniciais: { prontuario_id: string; tipo_secao: string; dados_json: object }[] = [
      'identificacao', 'anamnese', 'queixa_principal', 'historia_clinica',
      'historia_familiar', 'objetivos_terapeuticos', 'planejamento_tratamento',
      'evolucao', 'encerramento'
    ].map(tipo => ({
      prontuario_id: data.id,
      tipo_secao: tipo,
      dados_json: {}
    }))

    await supabase.from('prontuario_secoes').insert(secoesIniciais)

    await loadData()
    
    if (data) {
      const { data: fullProntuario } = await supabase
        .from('prontuarios')
        .select(`
          id,
          status,
          data_criacao,
          data_atualizacao,
          versao,
          paciente:patients(id, full_name, email, phone)
        `)
        .eq('id', data.id)
        .single()
      
      if (fullProntuario) {
        setSelectedProntuario({
          ...fullProntuario,
          paciente: fullProntuario.paciente?.[0] || fullProntuario.paciente
        })
        await loadProntuarioDetails(data.id)
        setActiveTab('dados')
      }
    }

    setShowNewProntuario(false)
    setSelectedPatientId('')
    setSaving(false)
  }

  async function saveSecao() {
    if (!selectedProntuario) return

    const secao = secoes.find(s => s.tipo_secao === activeSecao)
    if (!secao) return

    setSaving(true)

    const { error } = await supabase
      .from('prontuario_secoes')
      .update({
        dados_json: secao.dados_json,
        data_preenchimento: new Date().toISOString(),
        preenchido_por: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', secao.id)

    if (error) {
      console.error('Erro ao salvar seção:', error)
      alert('Erro ao salvar')
    } else {
      await loadProntuarioDetails(selectedProntuario.id)
    }

    setSaving(false)
  }

  async function saveSessao() {
    if (!selectedProntuario) return

    setSaving(true)

    let result

    if (editingSessao) {
      result = await supabase
        .from('sessoes_clinicas')
        .update({
          data_sessao: sessaoForm.dataSessao,
          hora_sessao: sessaoForm.horaSessao || null,
          duracao_minutos: sessaoForm.duracaoMinutos,
          tipo_sessao: sessaoForm.tipoSessao,
          tema_principal: sessaoForm.temaPrincipal || null,
          intervencoes: sessaoForm.intervencoes || null,
          evolucao: sessaoForm.evolucao || null,
          observacoes: sessaoForm.observacoes || null,
          proximas_tarefas: sessaoForm.proximasTarefas || null,
          presenca: sessaoForm.presenca
        })
        .eq('id', editingSessao.id)
    } else {
      const { data: ultimo } = await supabase
        .from('sessoes_clinicas')
        .select('numero_sessao')
        .eq('prontuario_id', selectedProntuario.id)
        .order('numero_sessao', { ascending: false })
        .limit(1)
        .single()

      const proximoNumero = (ultimo?.numero_sessao || 0) + 1

      result = await supabase
        .from('sessoes_clinicas')
        .insert({
          prontuario_id: selectedProntuario.id,
          numero_sessao: proximoNumero,
          data_sessao: sessaoForm.dataSessao,
          hora_sessao: sessaoForm.horaSessao || null,
          duracao_minutos: sessaoForm.duracaoMinutos,
          tipo_sessao: sessaoForm.tipoSessao,
          tema_principal: sessaoForm.temaPrincipal || null,
          intervencoes: sessaoForm.intervencoes || null,
          evolucao: sessaoForm.evolucao || null,
          observacoes: sessaoForm.observacoes || null,
          proximas_tarefas: sessaoForm.proximasTarefas || null,
          presenca: sessaoForm.presenca,
          registradas_por: (await supabase.auth.getUser()).data.user?.id
        })
    }

    if (result.error) {
      console.error('Erro ao salvar sessão:', result.error)
      alert('Erro ao salvar sessão')
    } else {
      await loadProntuarioDetails(selectedProntuario.id)
      setShowSessaoModal(false)
      setEditingSessao(null)
      setSessaoForm({
        dataSessao: '',
        horaSessao: '',
        duracaoMinutos: 50,
        tipoSessao: 'presencial',
        temaPrincipal: '',
        intervencoes: '',
        evolucao: '',
        observacoes: '',
        proximasTarefas: '',
        presenca: 'compareceu'
      })
    }

    setSaving(false)
  }

  async function deleteSessao(sessaoId: string) {
    const { error } = await supabase
      .from('sessoes_clinicas')
      .delete()
      .eq('id', sessaoId)

    if (error) {
      console.error('Erro ao excluir sessão:', error)
      alert('Erro ao excluir sessão')
    } else {
      await loadProntuarioDetails(selectedProntuario!.id)
    }

    setShowDeleteConfirm(null)
  }

  async function encerrarProntuario() {
    if (!selectedProntuario) return

    const confirm = window.confirm('Tem certeza que deseja encerrar este prontuário?')
    if (!confirm) return

    const { error } = await supabase
      .from('prontuarios')
      .update({ status: 'encerrado' })
      .eq('id', selectedProntuario.id)

    if (error) {
      console.error('Erro ao encerrar prontuário:', error)
      alert('Erro ao encerrar')
    } else {
      await loadData()
      setSelectedProntuario(null)
    }
  }

  function openProntuario(prontuario: Prontuario) {
    setSelectedProntuario(prontuario)
    loadProntuarioDetails(prontuario.id)
    setActiveTab('dados')
    setActiveSecao('identificacao')
  }

  const currentSecao = secoes.find(s => s.tipo_secao === activeSecao)
  const availablePatients = patients.filter(
    p => !prontuarios.some(pr => pr.paciente.id === p.id)
  )

  const filteredProntuarios = prontuarios.filter(p => 
    p.paciente.full_name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Prontuários</h1>
        
        <button
          onClick={() => setShowNewProntuario(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          + Novo Prontuário
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Buscar prontuário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>

      {filteredProntuarios.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Nenhum prontuário encontrado
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y">
            {filteredProntuarios.map((prontuario) => (
              <div 
                key={prontuario.id} 
                className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                onClick={() => openProntuario(prontuario)}
              >
                <div>
                  <div className="font-medium">{prontuario.paciente.full_name}</div>
                  <div className="text-sm text-gray-500">
                    Criado em {new Date(prontuario.data_criacao).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${
                  prontuario.status === 'ativo' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {prontuario.status === 'ativo' ? 'Ativo' : 'Encerrado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNewProntuario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Novo Prontuário</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Selecionar Paciente</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Selecione...</option>
                {availablePatients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNewProntuario(false)
                  setSelectedPatientId('')
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={createProntuario}
                disabled={saving || !selectedPatientId}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProntuario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Prontuário - {selectedProntuario.paciente.full_name}
                </h2>
                <p className="text-sm text-gray-500">
                  Status: {selectedProntuario.status === 'ativo' ? 'Ativo' : 'Encerrado'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedProntuario.status === 'ativo' && (
                  <button
                    onClick={encerrarProntuario}
                    className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    Encerrar
                  </button>
                )}
                <button
                  onClick={() => setSelectedProntuario(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="border-b">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('dados')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'dados'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dados do Prontuário
                </button>
                <button
                  onClick={() => setActiveTab('sessoes')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
                    activeTab === 'sessoes'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sessões ({sessoes.length})
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex">
              {activeTab === 'dados' ? (
                <>
                  <div className="w-48 sm:w-64 border-r overflow-y-auto p-2">
                    {(Object.keys(SECOES_LABELS) as SecaoTipo[]).map((tipo) => (
                      <button
                        key={tipo}
                        onClick={() => setActiveSecao(tipo)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 ${
                          activeSecao === tipo
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {SECOES_LABELS[tipo]}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto">
                    <h3 className="font-medium mb-3">{SECOES_LABELS[activeSecao]}</h3>
                    
                    {activeSecao === 'identificacao' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">Nome Completo</label>
                          <input
                            type="text"
                            value={currentSecao?.dados_json?.nome_completo || ''}
                            onChange={(e) => {
                              const updated = [...secoes]
                              const idx = updated.findIndex(s => s.tipo_secao === activeSecao)
                              if (idx >= 0) {
                                updated[idx] = {
                                  ...updated[idx],
                                  dados_json: { ...updated[idx].dados_json, nome_completo: e.target.value }
                                }
                                setSecoes(updated)
                              }
                            }}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">Data de Nascimento</label>
                          <input
                            type="date"
                            value={currentSecao?.dados_json?.data_nascimento || ''}
                            onChange={(e) => {
                              const updated = [...secoes]
                              const idx = updated.findIndex(s => s.tipo_secao === activeSecao)
                              if (idx >= 0) {
                                updated[idx] = {
                                  ...updated[idx],
                                  dados_json: { ...updated[idx].dados_json, data_nascimento: e.target.value }
                                }
                                setSecoes(updated)
                              }
                            }}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">CPF</label>
                          <input
                            type="text"
                            value={currentSecao?.dados_json?.cpf || ''}
                            onChange={(e) => {
                              const updated = [...secoes]
                              const idx = updated.findIndex(s => s.tipo_secao === activeSecao)
                              if (idx >= 0) {
                                updated[idx] = {
                                  ...updated[idx],
                                  dados_json: { ...updated[idx].dados_json, cpf: e.target.value }
                                }
                                setSecoes(updated)
                              }
                            }}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">Telefone</label>
                          <input
                            type="text"
                            value={currentSecao?.dados_json?.telefone || ''}
                            onChange={(e) => {
                              const updated = [...secoes]
                              const idx = updated.findIndex(s => s.tipo_secao === activeSecao)
                              if (idx >= 0) {
                                updated[idx] = {
                                  ...updated[idx],
                                  dados_json: { ...updated[idx].dados_json, telefone: e.target.value }
                                }
                                setSecoes(updated)
                              }
                            }}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-500 mb-1">Endereço</label>
                          <textarea
                            value={currentSecao?.dados_json?.endereco || ''}
                            onChange={(e) => {
                              const updated = [...secoes]
                              const idx = updated.findIndex(s => s.tipo_secao === activeSecao)
                              if (idx >= 0) {
                                updated[idx] = {
                                  ...updated[idx],
                                  dados_json: { ...updated[idx].dados_json, endereco: e.target.value }
                                }
                                setSecoes(updated)
                              }
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {['anamnese', 'queixa_principal', 'historia_clinica', 'historia_familiar', 
                      'objetivos_terapeuticos', 'planejamento_tratamento', 'evolucao', 'encerramento'].includes(activeSecao) && (
                      <div>
                        <textarea
                          value={currentSecao?.dados_json?.conteudo || ''}
                          onChange={(e) => {
                            const updated = [...secoes]
                            const idx = updated.findIndex(s => s.tipo_secao === activeSecao)
                            if (idx >= 0) {
                              updated[idx] = {
                                ...updated[idx],
                                dados_json: { ...updated[idx].dados_json, conteudo: e.target.value }
                              }
                              setSecoes(updated)
                            }
                          }}
                          rows={10}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          placeholder={`Preencha as informações de ${SECOES_LABELS[activeSecao].toLowerCase()}...`}
                        />
                      </div>
                    )}

                    <button
                      onClick={saveSecao}
                      disabled={saving}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Histórico de Sessões</h3>
                    <button
                      onClick={() => {
                        setEditingSessao(null)
                        setSessaoForm({
                          dataSessao: new Date().toISOString().split('T')[0],
                          horaSessao: '',
                          duracaoMinutos: 50,
                          tipoSessao: 'presencial',
                          temaPrincipal: '',
                          intervencoes: '',
                          evolucao: '',
                          observacoes: '',
                          proximasTarefas: '',
                          presenca: 'compareceu'
                        })
                        setShowSessaoModal(true)
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      + Nova Sessão
                    </button>
                  </div>

                  {sessoes.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nenhuma sessão registrada</p>
                  ) : (
                    <div className="space-y-3">
                      {sessoes.map((sessao) => (
                        <div key={sessao.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-medium">Sessão {sessao.numero_sessao}</span>
                              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                sessao.presenca === 'compareceu' ? 'bg-green-100 text-green-800' :
                                sessao.presenca === 'faltou' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {sessao.presenca === 'compareceu' ? 'Compareceu' : 
                                 sessao.presenca === 'faltou' ? 'Faltou' : 
                                 sessao.presenca === 'remarcado' ? 'Remarcado' : 'Cancelado'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingSessao(sessao)
                                  setSessaoForm({
                                    dataSessao: sessao.data_sessao,
                                    horaSessao: sessao.hora_sessao || '',
                                    duracaoMinutos: sessao.duracao_minutos,
                                    tipoSessao: sessao.tipo_sessao,
                                    temaPrincipal: sessao.tema_principal || '',
                                    intervencoes: sessao.intervencoes || '',
                                    evolucao: sessao.evolucao || '',
                                    observacoes: sessao.observacoes || '',
                                    proximasTarefas: sessao.proximas_tarefas || '',
                                    presenca: sessao.presenca
                                  })
                                  setShowSessaoModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(sessao.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(sessao.data_sessao).toLocaleDateString('pt-BR')}
                            {sessao.hora_sessao && ` às ${sessao.hora_sessao}`}
                            {' • '}{sessao.duracao_minutos} min
                            {' • '}{sessao.tipo_sessao === 'presencial' ? 'Presencial' : 
                                   sessao.tipo_sessao === 'online' ? 'Online' : 'Telefônica'}
                          </div>
                          {sessao.tema_principal && (
                            <div className="mt-2 text-sm">
                              <strong>Tema:</strong> {sessao.tema_principal}
                            </div>
                          )}
                          {sessao.evolucao && (
                            <div className="mt-2 text-sm">
                              <strong>Evolução:</strong> {sessao.evolucao}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSessaoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingSessao ? 'Editar Sessão' : 'Nova Sessão'}
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data *</label>
                <input
                  type="date"
                  value={sessaoForm.dataSessao}
                  onChange={(e) => setSessaoForm({ ...sessaoForm, dataSessao: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hora</label>
                <input
                  type="time"
                  value={sessaoForm.horaSessao}
                  onChange={(e) => setSessaoForm({ ...sessaoForm, horaSessao: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duração (min)</label>
                <input
                  type="number"
                  value={sessaoForm.duracaoMinutos}
                  onChange={(e) => setSessaoForm({ ...sessaoForm, duracaoMinutos: parseInt(e.target.value) || 50 })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={sessaoForm.tipoSessao}
                  onChange={(e) => setSessaoForm({ ...sessaoForm, tipoSessao: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="presencial">Presencial</option>
                  <option value="online">Online</option>
                  <option value="telefonica">Telefônica</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Presença</label>
                <select
                  value={sessaoForm.presenca}
                  onChange={(e) => setSessaoForm({ ...sessaoForm, presenca: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="compareceu">Compareceu</option>
                  <option value="faltou">Faltou</option>
                  <option value="remarcado">Remarcado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Tema Principal</label>
              <input
                type="text"
                value={sessaoForm.temaPrincipal}
                onChange={(e) => setSessaoForm({ ...sessaoForm, temaPrincipal: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Intervenções</label>
              <textarea
                value={sessaoForm.intervencoes}
                onChange={(e) => setSessaoForm({ ...sessaoForm, intervencoes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Evolução</label>
              <textarea
                value={sessaoForm.evolucao}
                onChange={(e) => setSessaoForm({ ...sessaoForm, evolucao: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Observações</label>
              <textarea
                value={sessaoForm.observacoes}
                onChange={(e) => setSessaoForm({ ...sessaoForm, observacoes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Próximas Tarefas</label>
              <textarea
                value={sessaoForm.proximasTarefas}
                onChange={(e) => setSessaoForm({ ...sessaoForm, proximasTarefas: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSessaoModal(false)
                  setEditingSessao(null)
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveSessao}
                disabled={saving || !sessaoForm.dataSessao}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-2">Confirmar Exclusão</h3>
            <p className="text-gray-500 mb-4">Tem certeza que deseja excluir esta sessão? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteSessao(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
