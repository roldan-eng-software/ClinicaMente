'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePsychologist } from '@/app/dashboard/context'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DailyData {
  date: string
  income: number
  expenses: number
  balance: number
}

export function FinancialReport() {
  const psychologist = usePsychologist()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<DailyData[]>([])
  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    balance: 0
  })
  const [daysBack, setDaysBack] = useState(30)

  useEffect(() => {
    loadFinancialData()
  }, [psychologist.id, daysBack])

  async function loadFinancialData() {
    setLoading(true)
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)
    
    // Fetch payments (income)
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, paid_at')
      .eq('psychologist_id', psychologist.id)
      .eq('status', 'paid')
      .gte('paid_at', startDate.toISOString())
      .lte('paid_at', endDate.toISOString())

    // Fetch expenses
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, date')
      .eq('psychologist_id', psychologist.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])

    // Process data into daily structure
    const dailyMap = new Map<string, { income: number; expenses: number }>()
    
    // Initialize all dates with 0
    for (let i = 0; i <= daysBack; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyMap.set(dateStr, { income: 0, expenses: 0 })
    }

    // Add payment income
    payments?.forEach((payment) => {
      if (payment.paid_at) {
        const dateStr = new Date(payment.paid_at).toISOString().split('T')[0]
        const current = dailyMap.get(dateStr) || { income: 0, expenses: 0 }
        current.income += payment.amount
        dailyMap.set(dateStr, current)
      }
    })

    // Add expenses
    expenses?.forEach((expense) => {
      const dateStr = expense.date
      const current = dailyMap.get(dateStr) || { income: 0, expenses: 0 }
      current.expenses += expense.amount
      dailyMap.set(dateStr, current)
    })

    // Convert to array and calculate balance
    const data = Array.from(dailyMap.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, { income, expenses }]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        income: income / 100, // Convert from cents to reais
        expenses: expenses / 100,
        balance: (income - expenses) / 100
      }))

    setChartData(data)

    // Calculate summary
    const totalIncome = payments?.reduce((acc, p) => acc + p.amount, 0) || 0
    const totalExpenses = expenses?.reduce((acc, e) => acc + e.amount, 0) || 0
    
    setSummary({
      income: totalIncome / 100,
      expenses: totalExpenses / 100,
      balance: (totalIncome - totalExpenses) / 100
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
        <h2 className="text-lg font-semibold mb-4">Relatório Financeiro</h2>
        <div className="text-center py-8 text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Receita</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.income)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Despesas</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.expenses)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Saldo</div>
          <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(summary.balance)}
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Evolução Financeira</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setDaysBack(30)}
              className={`px-3 py-1 rounded text-sm font-medium ${daysBack === 30 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              30 dias
            </button>
            <button
              onClick={() => setDaysBack(60)}
              className={`px-3 py-1 rounded text-sm font-medium ${daysBack === 60 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              60 dias
            </button>
            <button
              onClick={() => setDaysBack(90)}
              className={`px-3 py-1 rounded text-sm font-medium ${daysBack === 90 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              90 dias
            </button>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhum dado disponível para o período selecionado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10B981" name="Receita" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" name="Despesas" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="balance" stroke="#3B82F6" name="Saldo" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
