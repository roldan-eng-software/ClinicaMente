'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePsychologist } from '../context'

interface Payment {
  id: string
  amount: number
  status: string
  payment_method: string
  paid_at: string
  due_date: string
  appointment_id: string
  patient_id: string
  patient?: {
    name: string
    email: string
  }
}

interface Summary {
  total: number
  paid: number
  pending: number
  overdue: number
}

export default function FinancialPage() {
  const psychologist = usePsychologist()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<Summary>({ total: 0, paid: 0, pending: 0, overdue: 0 })
  const [isPro, setIsPro] = useState(false)
  
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)

  const [patients, setPatients] = useState<{id: string, name: string}[]>([])
  const [availableSlots, setAvailableSlots] = useState<{id: string, scheduled_at: string}[]>([])
  
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentId: '',
    amount: '',
    paymentMethod: 'pix',
    paidAt: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    checkPlanAndLoadPayments()
  }, [statusFilter, dateFrom, dateTo])

  async function checkPlanAndLoadPayments() {
    setLoading(true)
    
    const { data: planData } = await supabase
      .from('plan_limits')
      .select('plan_type')
      .eq('psychologist_id', psychologist.id)
      .single()

    setIsPro(planData?.plan_type === 'pro')

    await loadPayments()
    await loadSummary()
    
    setLoading(false)
  }

  async function loadPayments() {
    let query = supabase
      .from('payments')
      .select(`
        id,
        amount,
        status,
        payment_method,
        paid_at,
        due_date,
        appointment_id,
        patient_id,
        patients:patient_id(name, email)
      `)
      .eq('psychologist_id', psychologist.id)
      .order('paid_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (dateFrom) {
      query = query.gte('paid_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('paid_at', dateTo + 'T23:59:59')
    }

    const { data } = await query

    if (data) {
      setPayments(data.map((p: any) => ({
        ...p,
        patient: p.patients?.[0] || null
      })))
    }
  }

  async function loadSummary() {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('psychologist_id', psychologist.id)
      .gte('paid_at', startOfMonth.toISOString())

    if (data) {
      const summaryData = {
        total: data.reduce((acc, p) => acc + p.amount, 0),
        paid: data.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0),
        pending: data.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0),
        overdue: data.filter(p => p.status === 'failed').reduce((acc, p) => acc + p.amount, 0),
      }
      setSummary(summaryData)
    }
  }

  async function loadPatientsAndSlots() {
    const { data: patientsData } = await supabase
      .from('patients')
      .select('id, name')
      .eq('psychologist_id', psychologist.id)
      .order('name')

    setPatients(patientsData || [])

    const { data: slotsData } = await supabase
      .from('slots')
      .select('id, scheduled_at')
      .eq('psychologist_id', psychologist.id)
      .eq('status', 'booked')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(50)

    setAvailableSlots(slotsData || [])
  }

  async function openNewPayment() {
    await loadPatientsAndSlots()
    setShowModal(true)
  }

  async function savePayment() {
    if (!formData.patientId || !formData.amount) return

    setSavingPayment(true)

    const { error } = await supabase
      .from('payments')
      .insert({
        psychologist_id: psychologist.id,
        patient_id: formData.patientId,
        appointment_id: formData.appointmentId || null,
        amount: Math.round(parseFloat(formData.amount) * 100),
        payment_method: formData.paymentMethod,
        status: 'paid',
        paid_at: new Date(formData.paidAt).toISOString(),
      })

    if (!error) {
      setShowModal(false)
      setFormData({
        patientId: '',
        appointmentId: '',
        amount: '',
        paymentMethod: 'pix',
        paidAt: new Date().toISOString().split('T')[0],
      })
      checkPlanAndLoadPayments()
    }

    setSavingPayment(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Pago',
      pending: 'Pendente',
      failed: 'Vencido',
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold">Financeiro</h1>
        
        <button
          onClick={openNewPayment}
          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center text-sm"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Registrar Pagamento</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {isPro ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="text-xs sm:text-sm text-gray-500">Total</div>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(summary.total)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="text-xs sm:text-sm text-gray-500">Recebido</div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(summary.paid)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="text-xs sm:text-sm text-gray-500">Pendente</div>
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{formatCurrency(summary.pending)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="text-xs sm:text-sm text-gray-500">Vencido</div>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(summary.overdue)}</div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-yellow-800 text-sm">
              Upgrade para o plano Pro para ver o resumo financeiro do mês.
            </span>
            <button
              onClick={() => {}}
              className="text-sm text-yellow-600 hover:underline sm:ml-2"
            >
              Ver planos
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-3 sm:p-4 border-b">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="min-w-[100px]">
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="failed">Vencido</option>
              </select>
            </div>
            
            <div className="min-w-[100px]">
              <label className="block text-xs text-gray-500 mb-1">De</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="min-w-[100px]">
              <label className="block text-xs text-gray-500 mb-1">Até</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 sm:py-12">Carregando...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-500 text-sm">
            Nenhum pagamento encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Método</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{formatDate(payment.paid_at)}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                      <div className="font-medium">{payment.patient?.name || '-'}</div>
                      <div className="text-gray-500 text-xs hidden sm:block">{payment.patient?.email}</div>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium">{formatCurrency(payment.amount)}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm capitalize hidden sm:table-cell">{payment.payment_method}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Registrar Pagamento</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Paciente *</label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">Consulta</label>
                <select
                  value={formData.appointmentId}
                  onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Nenhuma</option>
                  {availableSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.scheduled_at).toLocaleString('pt-BR')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="150.00"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">Método de pagamento</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pix">PIX</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="debit_card">Cartão de Débito</option>
                  <option value="cash">Dinheiro</option>
                  <option value="transfer">Transferência</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">Data do pagamento</label>
                <input
                  type="date"
                  value={formData.paidAt}
                  onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={savePayment}
                disabled={savingPayment || !formData.patientId || !formData.amount}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {savingPayment ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
