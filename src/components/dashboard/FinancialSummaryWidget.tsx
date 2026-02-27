'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePsychologist } from '@/app/dashboard/context'

interface FinancialSummary {
  income: number
  expenses: number
  balance: number
  pendingPayments: number
  paidAppointments: number
}

export function FinancialSummaryWidget() {
  const psychologist = usePsychologist()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<FinancialSummary>({
    income: 0,
    expenses: 0,
    balance: 0,
    pendingPayments: 0,
    paidAppointments: 0
  })

  useEffect(() => {
    loadSummary()
  }, [psychologist.id])

  async function loadSummary() {
    setLoading(true)
    
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
    
    // Fetch paid payments for current month
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('psychologist_id', psychologist.id)
      .eq('status', 'paid')
      .gte('paid_at', startOfMonth)
      .lte('paid_at', endOfMonth)

    // Fetch pending payments
    const { data: pendingPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('psychologist_id', psychologist.id)
      .eq('status', 'pending')

    // Fetch expenses for current month
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('psychologist_id', psychologist.id)
      .gte('date', startOfMonth.split('T')[0])
      .lte('date', endOfMonth.split('T')[0])

    // Fetch paid appointments count
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, payment_status')
      .eq('psychologist_id', psychologist.id)
      .eq('payment_status', 'paid')
      .gte('created_at', startOfMonth)

    const totalIncome = payments?.reduce((acc, p) => acc + p.amount, 0) || 0
    const totalExpenses = expenses?.reduce((acc, e) => acc + e.amount, 0) || 0
    const totalPending = pendingPayments?.reduce((acc, p) => acc + p.amount, 0) || 0
    
    setSummary({
      income: totalIncome / 100,
      expenses: totalExpenses / 100,
      balance: (totalIncome - totalExpenses) / 100,
      pendingPayments: totalPending / 100,
      paidAppointments: appointments?.length || 0
    })
    
    setLoading(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Resumo Financeiro</h2>
        <div className="text-center py-8 text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Resumo Financeiro</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Receita do Mês</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(summary.income)}</div>
        </div>
        
        <div className="p-4 bg-red-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Despesas do Mês</div>
          <div className="text-xl font-bold text-red-600">{formatCurrency(summary.expenses)}</div>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Saldo do Mês</div>
          <div className={`text-xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(summary.balance)}
          </div>
        </div>
        
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Pagamentos Pendentes</div>
          <div className="text-xl font-bold text-yellow-600">{formatCurrency(summary.pendingPayments)}</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Sessões Pagas este Mês</span>
          <span className="font-semibold">{summary.paidAppointments}</span>
        </div>
      </div>
    </div>
  )
}
