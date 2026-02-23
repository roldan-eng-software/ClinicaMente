'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePsychologist } from '../context'

interface Appointment {
  id: string
  scheduled_at: string
  status: string
  patient_id: string
  patient?: {
    name: string
    email: string
  }
  session_note?: {
    id: string
    content: string
    created_at: string
    updated_at: string
  }
}

const ENCRYPTION_KEY = 'clinicamente-encryption-key-v1'

async function encrypt(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  
  const keyBuffer = new TextEncoder().encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )
  
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  )
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  
  return btoa(String.fromCharCode(...combined))
}

async function decrypt(encryptedText: string): Promise<string> {
  try {
    const combined = new Uint8Array(
      atob(encryptedText).split('').map(c => c.charCodeAt(0))
    )
    
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)
    
    const keyBuffer = new TextEncoder().encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    )
    
    return new TextDecoder().decode(decrypted)
  } catch {
    return '[Erro ao descriptografar]'
  }
}

export default function RecordsPage() {
  const psychologist = usePsychologist()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    checkPlanAndLoadData()
  }, [])

  async function checkPlanAndLoadData() {
    setLoading(true)
    
    const { data: planData } = await supabase
      .from('plan_limits')
      .select('plan_type')
      .eq('psychologist_id', psychologist.id)
      .single()

    const pro = planData?.plan_type === 'pro'
    setIsPro(pro)

    if (!pro) {
      setLoading(false)
      return
    }

    await createAuditLog()
    await loadAppointments()
    
    setLoading(false)
  }

  async function createAuditLog() {
    await supabase
      .from('audit_logs')
      .insert({
        psychologist_id: psychologist.id,
        action: 'access_prontuario',
        details: { page: 'prontuario' },
      })
  }

  async function loadAppointments() {
    let query = supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        patient_id,
        patients:patient_id(name, email),
        session_note:session_notes(id, content, created_at, updated_at)
      `)
      .eq('psychologist_id', psychologist.id)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })

    if (search) {
      query = query.or(`patients.name.ilike.%${search}%`)
    }

    const { data } = await query

    if (data) {
      const decrypted = await Promise.all(
        data.map(async (apt: any) => {
          if (apt.session_note?.[0]?.content) {
            try {
              apt.session_note[0].content = await decrypt(apt.session_note[0].content)
            } catch {
              apt.session_note[0].content = '[Erro ao descriptografar]'
            }
          }
          return apt
        })
      )
      setAppointments(decrypted.map((apt: any) => ({
        ...apt,
        patient: apt.patients?.[0] || null,
        session_note: apt.session_note?.[0] || null
      })))
    }
  }

  async function saveNote() {
    if (!selectedAppointment || !noteContent.trim()) return

    setSaving(true)

    const encryptedContent = await encrypt(noteContent)

    if (selectedAppointment.session_note) {
      await supabase
        .from('session_notes')
        .update({
          content: encryptedContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedAppointment.session_note.id)
    } else {
      await supabase
        .from('session_notes')
        .insert({
          psychologist_id: psychologist.id,
          patient_id: selectedAppointment.patient_id,
          appointment_id: selectedAppointment.id,
          content: encryptedContent,
        })
    }

    await supabase
      .from('audit_logs')
      .insert({
        psychologist_id: psychologist.id,
        action: 'edit_prontuario',
        details: { 
          appointment_id: selectedAppointment.id,
          patient_id: selectedAppointment.patient_id 
        },
      })

    await loadAppointments()
    
    setSelectedAppointment(null)
    setNoteContent('')
    setSaving(false)
  }

  function openNoteEditor(apt: Appointment) {
    setSelectedAppointment(apt)
    setNoteContent(apt.session_note?.content || '')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!isPro) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Prontuário</h1>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-12 h-12 text-yellow-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-yellow-800">Recurso Exclusivo do Plano Pro</h3>
              <p className="mt-2 text-yellow-700">
                O prontuário eletrônico criptografado está disponível apenas para o plano Pro.
                Faça upgrade para acessar este recurso.
              </p>
              <button
                onClick={() => {}}
                className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
              >
                Ver Planos
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold">Prontuário</h1>
        
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-blue-700 text-xs sm:text-sm">
            Os prontuários são criptografados com AES-256. Apenas você pode acessá-los.
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {appointments.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-500 text-sm">
            Nenhuma consulta concluída encontrada
          </div>
        ) : (
          <div className="divide-y">
            {appointments.map((apt) => (
              <div key={apt.id} className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="min-w-0">
                  <div className="font-medium text-sm sm:text-base truncate">{apt.patient?.name}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{formatDateTime(apt.scheduled_at)}</div>
                </div>
                <div className="flex flex-row sm:flex-row items-center justify-between sm:justify-end gap-2 sm:gap-3">
                  {apt.session_note ? (
                    <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 text-xs sm:text-sm rounded-full">
                      Com anotação
                    </span>
                  ) : (
                    <span className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-600 text-xs sm:text-sm rounded-full">
                      Sem anotação
                    </span>
                  )}
                  <button
                    onClick={() => openNoteEditor(apt)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700"
                  >
                    {apt.session_note ? 'Editar' : 'Adicionar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-lg sm:max-w-2xl">
            <h3 className="text-base sm:text-lg font-semibold mb-2">
              Prontuário - {selectedAppointment.patient?.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
              Consulta: {formatDateTime(selectedAppointment.scheduled_at)}
            </p>
            
            <div>
              <label className="block text-sm text-gray-500 mb-2">Anotação</label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={6}
                className="w-full p-2 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Descreva observações, evoluções, técnicas utilizadas..."
              />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-3 mt-4 sm:mt-6">
              <button
                onClick={() => {
                  setSelectedAppointment(null)
                  setNoteContent('')
                }}
                className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button
                onClick={saveNote}
                disabled={saving || !noteContent.trim()}
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm w-full sm:w-auto"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
