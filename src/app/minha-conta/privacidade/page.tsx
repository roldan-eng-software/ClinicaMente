'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { createDeletionRequest } from '@/app/actions/deletion-request'

interface PatientData {
  id: string
  full_name: string
  email: string
  phone: string
  birthdate: string
  notes_general: string
  created_at: string
}

interface Appointment {
  id: string
  scheduled_at: string
  status: string
  psychologists?: {
    full_name: string
  }[]
}

interface Payment {
  id: string
  amount: number
  status: string
  paid_at: string
}

interface ConsentLog {
  id: string
  consent_type: string
  consent_version: string
  granted: boolean
  created_at: string
}

export default function PatientPrivacyPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [consentLogs, setConsentLogs] = useState<ConsentLog[]>([])
  const [activeTab, setActiveTab] = useState<'data' | 'appointments' | 'payments' | 'consent' | 'deletion'>('data')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteType, setDeleteType] = useState<'anonymize' | 'delete'>('anonymize')
  const [deleteReason, setDeleteReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!patient) {
      router.push('/login')
      return
    }

    setPatientData(patient as any)

    const [appointmentsData, paymentsData, consentData] = await Promise.all([
      supabase
        .from('appointments')
        .select(`
          id,
          scheduled_at,
          status,
          psychologists:psychologists(full_name)
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

    setAppointments(appointmentsData.data || [])
    setPayments(paymentsData.data || [])
    setConsentLogs(consentData.data || [])
    
    setLoading(false)
  }

  async function exportData(format: 'json' | 'csv') {
    if (!patientData) return

    const data = {
      patient: {
        id: patientData?.id,
        name: patientData?.full_name,
        email: patientData?.email,
        phone: patientData?.phone,
        birthdate: patientData?.birthdate,
        created_at: patientData?.created_at,
      },
      appointments: appointments,
      payments: payments,
      consentLogs: consentLogs,
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meus-dados-${new Date().toISOString().split('T')[0]}.json`
      a.click()
    } else {
      let csv = 'Tipo,ID,Data,Detalhes\n'
      
      csv += `Paciente,${patientData.id},${patientData.created_at},${patientData.full_name}\n`
      
      for (const apt of appointments) {
        csv += `Consulta,${apt.id},${apt.scheduled_at},${apt.status}\n`
      }
      
      for (const pay of payments) {
        csv += `Pagamento,${pay.id},${pay.paid_at},R$ ${pay.amount / 100} - ${pay.status}\n`
      }
      
      for (const log of consentLogs) {
        csv += `Consentimento,${log.id},${log.created_at},${log.consent_type} v${log.consent_version}\n`
      }

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meus-dados-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    }
  }

  async function submitDeletionRequest() {
    if (!deleteReason.trim()) {
      setMessage({ type: 'error', text: 'Por favor, informe o motivo' })
      return
    }

    setSubmitting(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('requestType', deleteType)
    formData.append('reason', deleteReason)

    const result = await createDeletionRequest(formData)

    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Solicitação enviada com sucesso. Você receberá um email de confirmação.' })
      setShowDeleteModal(false)
      setDeleteReason('')
    }

    setSubmitting(false)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-2">Privacidade e Dados</h1>
          <p className="text-gray-600 mb-8">
            Gerencie seus dados pessoais conforme a LGPD (Lei Geral de Proteção de Dados)
          </p>

          <div className="border-b mb-6">
            <nav className="flex space-x-8">
              {[
                { id: 'data', label: 'Meus Dados' },
                { id: 'appointments', label: 'Consultas' },
                { id: 'payments', label: 'Pagamentos' },
                { id: 'consent', label: 'Consentimentos' },
                { id: 'deletion', label: 'Exclusão' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Seus Dados Cadastrais</h2>
                <div className="space-x-2">
                  <button
                    onClick={() => exportData('json')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Exportar JSON
                  </button>
                  <button
                    onClick={() => exportData('csv')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Exportar CSV
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Nome', value: patientData?.full_name },
                  { label: 'Email', value: patientData?.email },
                  { label: 'Telefone', value: patientData?.phone || '-' },
                  { label: 'Data de Nascimento', value: patientData?.birthdate ? formatDate(patientData.birthdate) : '-' },
                  { label: 'Cadastrado em', value: patientData?.created_at ? formatDate(patientData.created_at) : '-' },
                ].map((field) => (
                  <div key={field.label} className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">{field.label}</div>
                    <div className="font-medium">{field.value}</div>
                  </div>
                ))}
              </div>

              {patientData?.notes_general && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500">Observações</div>
                  <div className="font-medium">{patientData.notes_general}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Histórico de Consultas</h2>
              {appointments.length === 0 ? (
                <div className="text-gray-500">Nenhuma consulta encontrada</div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-medium">{formatDateTime(apt.scheduled_at)}</div>
                        <div className="text-sm text-gray-500">Psicólogo: {apt.psychologists?.[0]?.full_name}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        apt.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Histórico de Pagamentos</h2>
              {payments.length === 0 ? (
                <div className="text-gray-500">Nenhum pagamento encontrado</div>
              ) : (
                <div className="space-y-3">
                  {payments.map((pay) => (
                    <div key={pay.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-medium">{formatCurrency(pay.amount)}</div>
                        <div className="text-sm text-gray-500">{pay.paid_at ? formatDate(pay.paid_at) : '-'}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        pay.status === 'paid' ? 'bg-green-100 text-green-800' :
                        pay.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {pay.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'consent' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Histórico de Consentimentos</h2>
              {consentLogs.length === 0 ? (
                <div className="text-gray-500">Nenhum consentimento registrado</div>
              ) : (
                <div className="space-y-3">
                  {consentLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-gray">
                      <div className="flex-50 rounded-lg justify-between items-center">
                        <div>
                          <div className="font-medium">{log.consent_type}</div>
                          <div className="text-sm text-gray-500">Versão: {log.consent_version}</div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          log.granted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.granted ? 'Concedido' : 'Negado'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-2">
                        {formatDateTime(log.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'deletion' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Solicitar Exclusão de Dados</h2>
                <p className="text-gray-600 text-sm">
                  Conforme a LGPD, você tem direito de solicitar a exclusão ou anonimização dos seus dados pessoais.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">Informações importantes:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• A solicitação será processada em até 15 dias</li>
                  <li>• Dados necessários para cumprimento de obrigações legais serão mantidos</li>
                  <li>• Você receberá um email de confirmação</li>
                </ul>
              </div>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Solicitar Exclusão de Dados
              </button>
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Solicitar Exclusão de Dados</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de solicitação
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={deleteType === 'anonymize'}
                      onChange={() => setDeleteType('anonymize')}
                      className="mr-2"
                    />
                    <span>Anonimizar dados (revestir dados)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={deleteType === 'delete'}
                      onChange={() => setDeleteType('delete')}
                      className="mr-2"
                    />
                    <span>Excluir dados (deletar completamente)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo (opcional)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={3}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Informe o motivo da solicitação..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={submitDeletionRequest}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar Solicitação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
