'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePsychologist } from '../context'

export default function CalendarSettingsPage() {
  const psychologist = usePsychologist()
  const supabase = createClient()
  
  const [calendarUrl, setCalendarUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncEnabled, setSyncEnabled] = useState(false)
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState('')

  useEffect(() => {
    generateUrls()
  }, [])

  function generateUrls() {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const icsUrl = `${baseUrl}/api/calendar/ics`
    setCalendarUrl(icsUrl)
    
    const encodedUrl = encodeURIComponent(icsUrl)
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Consultas+ClínicaMente&details=Importado+do+ClínicaMente&dates=&recur=①&add=${encodedUrl}`
    setGoogleCalendarUrl(gcalUrl)
    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(calendarUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleImportGoogle = () => {
    window.open(googleCalendarUrl, '_blank')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sincronização de Calendário</h1>
        <p className="text-gray-600 mt-1">
          Sincronize seus agendamentos com Google Calendar, Apple Calendar ou Outlook
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">🔗 Link do Calendário (iCal)</h2>
        
        <p className="text-sm text-gray-600 mb-4">
          Use este link para importar seus agendamentos em qualquer calendário. 
          O link é atualizado automaticamente com novos agendamentos.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={calendarUrl}
            className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
          >
            {copied ? 'Copiado!' : 'Copiar Link'}
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">📅 Como importar no Google Calendar</h3>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
            <li>Clique no botão "Importar no Google" abaixo</li>
            <li>Selecione o calendário onde deseja adicionar</li>
            <li>Clique em "Importar"</li>
            <li>Repita o processo a cada 3 meses para atualizar</li>
          </ol>
          <button
            onClick={handleImportGoogle}
            className="mt-3 px-4 py-2 bg-white border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium"
          >
            📥 Importar no Google Calendar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">📱 Instruções por Plataforma</h2>
        
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-medium">Google Calendar</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configurações → Importar e exportar → Importar (cole o link na URL)
            </p>
          </div>
          
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-medium">Apple Calendar (macOS/iOS)</h3>
            <p className="text-sm text-gray-600 mt-1">
              Arquivo → Nova assinatura de calendário → Cole o link
            </p>
          </div>
          
          <div className="border-l-4 border-blue-700 pl-4">
            <h3 className="font-medium">Microsoft Outlook</h3>
            <p className="text-sm text-gray-600 mt-1">
              Arquivo → Opções do Outlook → Calendário → Opções de compartilhamento → Assinar um calendário
            </p>
          </div>
          
          <div className="border-l-4 border-orange-500 pl-4">
            <h3 className="font-medium">Outros calendários</h3>
            <p className="text-sm text-gray-600 mt-1">
              Procure a opção "Importar" ou "Assinar calendário" e cole o link acima
            </p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-medium text-yellow-800">Observações</h3>
            <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
              <li>Os agendamentos são exportados com 3 meses de antecedência</li>
              <li>Apenas consultas confirmadas são incluídas</li>
              <li>Para atualizar, reimporte o calendário periodicamente</li>
              <li>Alterações no ClínicaMente não se sincronizam automaticamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
