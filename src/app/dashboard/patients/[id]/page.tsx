'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePsychologist } from '../../context'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

interface Patient {
  id: string
  full_name: string
  email: string
  phone: string
  cpf: string
  date_of_birth: string
  address: string
  notes: string
  created_at: string
  updated_at: string
}

interface Appointment {
  id: string
  scheduled_at: string
  status: string
  slot_id: string
  slot?: {
    scheduled_at: string
  }
}

interface Payment {
  id: string
  amount: number
  status: string
  paid_at: string
  appointment_id: string
}

interface SessionNote {
  id: string
  content: string
  created_at: string
}

type Tab = 'info' | 'appointments' | 'payments' | 'notes'

export default function PatientDetailPage() {
  const psychologist = usePsychologist()
  const supabase = createClient()
  const params = useParams()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [notes, setNotes] = useState<SessionNote[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [isPro, setIsPro] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<Patient>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchingCep, setSearchingCep] = useState(false)

  async function searchCep(cep: string) {
    if (cep.replace(/\D/g, '').length !== 8) return

    setSearchingCep(true)
    try {
      const response = await fetch(`/api/cep?cep=${cep}`)
      const data = await response.json()

      if (!data.error && data.logradouro) {
        const address = `${data.logradouro}${data.complemento ? ', ' + data.complemento : ''}, ${data.bairro}, ${data.cidade}-${data.estado}`
        setFormData(prev => ({
          ...prev,
          address: address
        }))
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err)
    } finally {
      setSearchingCep(false)
    }
  }

  useEffect(() => {
    checkPlanAndLoadData()
  }, [params.id])

  async function checkPlanAndLoadData() {
    setLoading(true)
    
    const { data: planData } = await supabase
      .from('plan_limits')
      .select('plan_type')
      .eq('psychologist_id', psychologist.id)
      .single()

    setIsPro(planData?.plan_type === 'pro')

    const { data: patientData } = await supabase
      .from('patients')
      .select('*')
      .eq('id', params.id)
      .eq('psychologist_id', psychologist.id)
      .single()

    if (!patientData) {
      router.push('/dashboard/patients')
      return
    }

    setPatient(patientData)
    setFormData(patientData)

    const { data: appointmentsData } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        slot_id,
        slot:slots(scheduled_at)
      `)
      .eq('patient_id', params.id)
      .eq('psychologist_id', psychologist.id)
      .order('scheduled_at', { ascending: false })

    if (appointmentsData) {
      setAppointments(appointmentsData.map((a: any) => ({
        ...a,
        slot: a.slot?.[0]
      })))
    }

    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*')
      .eq('patient_id', params.id)
      .eq('psychologist_id', psychologist.id)
      .order('paid_at', { ascending: false })

    if (paymentsData) {
      setPayments(paymentsData)
    }

    const { data: notesData } = await supabase
      .from('session_notes')
      .select('*')
      .eq('patient_id', params.id)
      .eq('psychologist_id', psychologist.id)
      .order('created_at', { ascending: false })

    if (notesData) {
      setNotes(notesData)
    }

    setLoading(false)
  }

  async function savePatientChanges() {
    if (!patient) return

    setError(null)
    setSuccess(null)
    setIsSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          full_name: formData.full_name || patient.full_name,
          email: formData.email || patient.email,
          phone: formData.phone || patient.phone,
          cpf: formData.cpf || patient.cpf,
          date_of_birth: formData.date_of_birth || patient.date_of_birth,
          address: formData.address || patient.address,
          notes: formData.notes !== undefined ? formData.notes : patient.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', patient.id)
        .eq('psychologist_id', psychologist.id)

      if (updateError) {
        setError('Erro ao salvar alterações. Tente novamente.')
        console.error('Update error:', updateError)
      } else {
        setSuccess('Alterações salvas com sucesso!')
        // Atualizar o estado local
        const updatedPatient = {
          ...patient,
          full_name: formData.full_name || patient.full_name,
          email: formData.email || patient.email,
          phone: formData.phone || patient.phone,
          cpf: formData.cpf || patient.cpf,
          date_of_birth: formData.date_of_birth || patient.date_of_birth,
          address: formData.address || patient.address,
          notes: formData.notes !== undefined ? formData.notes : patient.notes,
          updated_at: new Date().toISOString(),
        }
        setPatient(updatedPatient)
        setIsEditing(false)
        setFormData({})
        
        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Erro inesperado ao salvar alterações.')
      console.error('Save error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  function handleEditClick() {
    if (isEditing) {
      // Cancelar edição
      setFormData({})
      setIsEditing(false)
      setError(null)
    } else {
      // Começar edição
      setIsEditing(true)
      setSuccess(null)
    }
  }

  const handleInputChange = (field: keyof Patient, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  async function saveNote() {
    if (!newNote.trim() || !patient) return

    setSavingNote(true)

    const { error } = await supabase
      .from('session_notes')
      .insert({
        patient_id: patient.id,
        psychologist_id: psychologist.id,
        content: newNote,
      })

    if (!error) {
      setNewNote('')
      checkPlanAndLoadData()
    }

    setSavingNote(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: 'Agendado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      paid: 'Pago',
      pending: 'Pendente',
      failed: 'Falhou',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!patient) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link
          href="/dashboard/patients"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-2xl font-medium">
                {patient.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold">{patient.full_name}</h1>
              <p className="text-gray-500">{patient.email}</p>
            </div>
          </div>
        </div>

        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dados Cadastrais
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'appointments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Consultas ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pagamentos ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Prontuário
              {!isPro && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">Pro</span>
              )}
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <>
              {/* Mensagens de sucesso e erro */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}

              {/* Botões Editar/Salvar */}
              <div className="mb-6 flex gap-3">
                {!isEditing ? (
                  <button
                    onClick={handleEditClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>
                ) : (
                  <>
                    <button
                      onClick={savePatientChanges}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      onClick={handleEditClick}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>

              {/* Formulário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email || patient.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="font-medium">{patient.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Telefone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone || patient.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="font-medium">{patient.phone || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">CPF</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.cpf || patient.cpf || ''}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="font-medium">{patient.cpf || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Data de Nascimento</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.date_of_birth ? formData.date_of_birth.split('T')[0] : (patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '')}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="font-medium">{patient.date_of_birth ? formatDate(patient.date_of_birth) : '-'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-500 mb-1">CEP</label>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="00000-000"
                        value={formData.address?.match(/\d{5}-?\d{3}/)?.[0] || ''}
                        onChange={(e) => {
                          const cep = e.target.value.replace(/\D/g, '')
                          if (cep.length === 8) {
                            searchCep(cep)
                          }
                        }}
                        onBlur={(e) => {
                          const cep = e.target.value.replace(/\D/g, '')
                          if (cep.length === 8) {
                            searchCep(cep)
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {searchingCep && (
                        <div className="flex items-center justify-center px-3">
                          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium">{patient.address?.match(/\d{5}-?\d{3}/)?.[0] || '-'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-500 mb-1">Endereço</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.address || patient.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="font-medium">{patient.address || '-'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-500 mb-1">Observações</label>
                  {isEditing ? (
                    <textarea
                      value={formData.notes !== undefined ? formData.notes : (patient.notes || '')}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                    />
                  ) : (
                    <p className="font-medium">{patient.notes || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Cadastrado em</label>
                  <p className="font-medium">{formatDate(patient.created_at)}</p>
                </div>
                {patient.updated_at && (
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Editado em</label>
                    <p className="font-medium">{formatDate(patient.updated_at)}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'appointments' && (
            <div>
              {appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma consulta agendada
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{formatDateTime(apt.slot?.scheduled_at || apt.scheduled_at)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(apt.status)}`}>
                        {getStatusLabel(apt.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum pagamento registrado
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-500">{payment.paid_at ? formatDate(payment.paid_at) : '-'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              {!isPro ? (
                <div className="text-center py-8">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <svg className="w-12 h-12 text-yellow-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h3 className="mt-4 text-lg font-medium text-yellow-800">Recurso Exclusivo do Plano Pro</h3>
                    <p className="mt-2 text-yellow-700">
                      Faça upgrade para acessar o prontuário eletrônico dos pacientes.
                    </p>
                    <button
                      onClick={() => router.push('/dashboard/settings/plan')}
                      className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                    >
                      Ver Planos
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex space-x-4">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Nova nota..."
                      className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <button
                      onClick={saveNote}
                      disabled={savingNote || !newNote.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 self-end"
                    >
                      {savingNote ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>

                  {notes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma nota registrada
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notes.map((note) => (
                        <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                          <p className="whitespace-pre-wrap">{note.content}</p>
                          <p className="text-sm text-gray-400 mt-2">{formatDateTime(note.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
