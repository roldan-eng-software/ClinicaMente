'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { usePsychologist } from './context'
import { UpcomingSessionsTable } from '@/components/dashboard/UpcomingSessionsTable'
import { FinancialReport } from '@/components/dashboard/FinancialReport'
import { PendenciesWidget } from '@/components/dashboard/PendenciesWidget'
import { TasksWidget } from '@/components/dashboard/TasksWidget'

type TabType = 'overview' | 'financial' | 'psiobank'

function DashboardContent() {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const psychologist = usePsychologist()

  const showWelcome = searchParams.get('welcome') === 'true'
  const welcomeName = searchParams.get('name') || ''
  const publicUrl = searchParams.get('url') || ''

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {showWelcome && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-medium text-sm border-b-2 ${
              activeTab === 'overview'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`px-4 py-3 font-medium text-sm border-b-2 ${
              activeTab === 'financial'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            Financeiro
          </button>
          <button
            onClick={() => setActiveTab('psiobank')}
            className={`px-4 py-3 font-medium text-sm border-b-2 ${
              activeTab === 'psiobank'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            PsioBank
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Upcoming Sessions */}
            <UpcomingSessionsTable />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pendencies and Tasks */}
              <div className="space-y-6 lg:col-span-1">
                <PendenciesWidget />
                <TasksWidget />
              </div>

              {/* Financial Summary - spans 2 columns */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Resumo Financeiro</h2>
                  <p className="text-gray-600 text-sm">Veja os detalhes financeiros completos na aba "Financeiro"</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <FinancialReport />
        )}

        {activeTab === 'psiobank' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">PsioBank</h2>
            <p className="text-gray-600">Funcionalidade em breve...</p>
          </div>
        )}
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
