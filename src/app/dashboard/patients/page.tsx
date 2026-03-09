'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePsychologist } from '../context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Patient {
  id: string
  full_name: string
  email: string
  phone: string
  created_at: string
  appointments_count?: number
}

export default function PatientsPage() {
  const psychologist = usePsychologist()
  const supabase = createClient()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [showLimitModal, setShowLimitModal] = useState(false)

  useEffect(() => {
    loadPatients()
  }, [search])

  async function loadPatients() {
    setLoading(true)
    
    let query = supabase
      .from('patients')
      .select(`
        id,
        full_name,
        email,
        phone,
        created_at,
        appointments:appointments(count)
      `)
      .eq('psychologist_id', psychologist.id)
      .order('full_name', { ascending: true })

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (!error && data) {
      const formatted = data.map((p: any) => ({
        ...p,
        appointments_count: p.appointments?.[0]?.count || 0
      }))
      setPatients(formatted)
    }
    
    setLoading(false)
  }

  async function checkAndAddPatient() {
    const { data: limitData } = await supabase
      .from('plan_limits')
      .select('max_patients')
      .eq('psychologist_id', psychologist.id)
      .single()

    const { count } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('psychologist_id', psychologist.id)

    const maxPatients = limitData?.max_patients || 10
    
    if (count !== null && count !== undefined && count >= maxPatients) {
      setShowLimitModal(true)
      return
    }

    router.push('/dashboard/patients/new')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold">Pacientes</h1>
        
        <button
          onClick={checkAndAddPatient}
          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Paciente
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-3 sm:p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg 
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 top-2.5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 sm:py-12">Carregando...</div>
        ) : patients.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-500 text-sm sm:text-base">Nenhum paciente encontrado</div>
            <button
              onClick={checkAndAddPatient}
              className="mt-2 sm:mt-4 text-blue-600 hover:underline text-sm sm:text-base"
            >
              Adicionar primeiro paciente
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {patients.map((patient) => (
              <Link
                key={patient.id}
                href={`/dashboard/patients/${patient.id}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 hover:bg-gray-50 gap-2 sm:gap-0"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-medium text-sm">
                      {patient.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{patient.full_name}</div>
                    <div className="text-xs sm:text-sm text-gray-500 truncate">{patient.email}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end sm:space-x-3 ml-11 sm:ml-0">
                  <div className="text-xs sm:text-sm text-gray-500 sm:hidden">
                    {patient.appointments_count} consulta(s)
                  </div>
                  <div className="hidden sm:block text-sm text-gray-500">
                    {patient.appointments_count} consulta(s)
                  </div>
                  <div className="hidden sm:block text-sm text-gray-400">
                    {formatDate(patient.created_at)}
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showLimitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto bg-yellow-100 rounded-full">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-medium text-center">Limite do Plano Atingido</h3>
            <p className="mt-2 text-center text-gray-500 text-sm sm:text-base">
              Você atingiu o limite de pacientes do plano gratuito. 
              Faça upgrade para o plano Pro para adicionar mais pacientes.
            </p>
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowLimitModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
              >
                Fechar
              </button>
              <button
                onClick={() => router.push('/dashboard/upgrade')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Ver Planos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
