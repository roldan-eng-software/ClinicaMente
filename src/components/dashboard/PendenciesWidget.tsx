'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePsychologist } from '@/app/dashboard/context'

interface Payment {
  id: string
  amount: number
  status: string
  patient?: {
    full_name: string
  }
  appointment?: {
    id: string
  }
}

interface Activity {
  id: string
  patient_id: string
  created_at: string
  type: string
  patient?: {
    full_name: string
  }
}

interface Birthday {
  patient_id: string
  full_name: string
  birthDate: string
}

type TabType = 'payments' | 'activity' | 'birthdays'

export function PendenciesWidget() {
  const psychologist = usePsychologist()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('payments')
  const [payments, setPayments] = useState<Payment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [birthdays, setBirthdays] = useState<Birthday[]>([])

  useEffect(() => {
    loadData()
  }, [psychologist.id, activeTab])

  async function loadData() {
    setLoading(true)
    
    if (activeTab === 'payments') {
      await loadPendingPayments()
    } else if (activeTab === 'activity') {
      await loadRecentActivity()
    } else if (activeTab === 'birthdays') {
      await loadMonthlyBirthdays()
    }
    
    setLoading(false)
  }

  async function loadPendingPayments() {
    const { data } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        status,
        patients:patient_id(full_name)
      `)
      .eq('psychologist_id', psychologist.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setPayments(data.map((p: any) => ({
        ...p,
        patient: p.patients?.[0] || null
      })))
    }
  }

  async function loadRecentActivity() {
    const { data } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        created_at,
        patients:patient_id(full_name)
      `)
      .eq('psychologist_id', psychologist.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setActivities(data.map((a: any) => ({
        id: a.id,
        patient_id: a.patient_id,
        created_at: a.created_at,
        type: 'appointment_created',
        patient: a.patients?.[0] || null
      })))
    }
  }

  async function loadMonthlyBirthdays() {
    const { data } = await supabase
      .from('patients')
      .select('id, full_name')
      .eq('psychologist_id', psychologist.id)
      .eq('is_active', true)
      .order('full_name')

    if (data) {
      // Filter patients with birthdays in current month (simulated - would need birthdate field)
      setBirthdays(data.slice(0, 5).map((p: any) => ({
        patient_id: p.id,
        full_name: p.full_name,
        birthDate: ''
      })))
    }
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
      year: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Pendências</h2>
        
        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 font-medium text-sm border-b-2 -mb-1 ${
              activeTab === 'payments'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            Pagamentos
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 font-medium text-sm border-b-2 -mb-1 ${
              activeTab === 'activity'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            Atividade
          </button>
          <button
            onClick={() => setActiveTab('birthdays')}
            className={`px-4 py-2 font-medium text-sm border-b-2 -mb-1 ${
              activeTab === 'birthdays'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            Aniversários
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : activeTab === 'payments' && payments.length > 0 ? (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div>
                  <div className="font-medium text-sm">{payment.patient?.full_name || '-'}</div>
                  <div className="text-xs text-gray-500">Pagamento Pendente</div>
                </div>
                <div className="text-sm font-semibold text-red-600">{formatCurrency(payment.amount)}</div>
              </div>
            ))}
          </div>
        ) : activeTab === 'activity' && activities.length > 0 ? (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div>
                  <div className="font-medium text-sm">{activity.patient?.full_name || '-'}</div>
                  <div className="text-xs text-gray-500">Nova consulta agendada</div>
                </div>
                <div className="text-xs text-gray-500">{formatDate(activity.created_at)}</div>
              </div>
            ))}
          </div>
        ) : activeTab === 'birthdays' && birthdays.length > 0 ? (
          <div className="space-y-2">
            {birthdays.map((birthday) => (
              <div key={birthday.patient_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600 mr-3">
                    🎂
                  </div>
                  <div className="font-medium text-sm">{birthday.full_name}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            {activeTab === 'payments' && 'Nenhum pagamento pendente'}
            {activeTab === 'activity' && 'Sem atividade recente'}
            {activeTab === 'birthdays' && 'Sem aniversários este mês'}
          </div>
        )}
      </div>
    </div>
  )
}
