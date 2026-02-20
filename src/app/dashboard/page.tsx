'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'

function DashboardContent() {
  const [loading, setLoading] = useState(true)
  const [psychologist, setPsychologist] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const showWelcome = searchParams.get('welcome') === 'true'
  const welcomeName = searchParams.get('name') || ''
  const publicUrl = searchParams.get('url') || ''

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: psychologistData } = await supabase
        .from('psychologists')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!psychologistData?.onboarding_completed) {
        router.push('/onboarding')
        return
      }

      setPsychologist(psychologistData)
      setLoading(false)
    }

    checkUser()
  }, [supabase, router])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        {showWelcome && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h2 className="text-lg font-semibold text-green-800">
                  Bem-vindo, {welcomeName}!
                </h2>
                <p className="text-green-700 mt-1">
                  Seu perfil foi configurado com sucesso. Agora você pode receber agendamentos dos seus pacientes.
                </p>
                
                <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link público da sua clínica
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      readOnly
                      value={publicUrl}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-r-md hover:bg-blue-700"
                    >
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600">0</div>
            <div className="text-gray-600 mt-1">Pacientes</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">0</div>
            <div className="text-gray-600 mt-1">Agendamentos</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600">R$ 0</div>
            <div className="text-gray-600 mt-1">Receita este mês</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">Carregando...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
