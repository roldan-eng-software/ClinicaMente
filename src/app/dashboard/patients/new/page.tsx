'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePsychologist } from '../../context'
import { useRouter } from 'next/navigation'

export default function NewPatientPage() {
  const psychologist = usePsychologist()
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!form.full_name || !form.email) {
      setError('Nome e email são obrigatórios')
      setLoading(false)
      return
    }

    const { data: existing, error: checkError } = await supabase
      .from('patients')
      .select('id')
      .eq('psychologist_id', psychologist.id)
      .ilike('email', form.email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erro ao verificar paciente:', checkError)
    }

    if (existing) {
      setError('Já existe um paciente com este email')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('patients')
      .insert({
        psychologist_id: psychologist.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        is_active: true,
      })

    if (insertError) {
      console.error('Erro ao criar paciente:', insertError)
      setError('Erro ao criar paciente. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/dashboard/patients')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Novo Paciente</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo *
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Criar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
