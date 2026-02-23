'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { bookSlot } from '@/app/actions/book-slot'

interface Slot {
  id: string
  start_at: string
  appointment_type?: string
}

interface Psychologist {
  id: string
  slug: string
  full_name: string
  crp: string
  specialty: string
  bio: string
  default_session_price: number
  session_duration_minutes: number
  timezone: string
}

interface Collaborator {
  id: string
  full_name: string
  specialty: string
  crp: string
  bio: string
}

interface Appointment {
  id: string
  status: string
  slot_id: string
  slots: {
    start_at: string
    appointment_type: string
  }[]
  psychologists?: {
    full_name: string
  }[]
}

const STEPS = [
  { id: 1, title: 'Login' },
  { id: 2, title: 'Profissional' },
  { id: 3, title: 'Horário' },
  { id: 4, title: 'Confirmar' },
]

export default function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [psychologist, setPsychologist] = useState<Psychologist | null>(null)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState<'psychologist' | 'collaborator'>('psychologist')
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<'presencial' | 'videoconferencia'>('presencial')
  const [currentStep, setCurrentStep] = useState(1)
  const [checkingSlot, setCheckingSlot] = useState(false)
  
  const [user, setUser] = useState<any>(null)
  const [patient, setPatient] = useState<any>(null)
  const [patientForm, setPatientForm] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [consentAccepted, setConsentAccepted] = useState(false)

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  })
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const [appointmentHistory, setAppointmentHistory] = useState<Appointment[]>([])

  useEffect(() => {
    checkAuthAndLoadData()
  }, [slug])

  useEffect(() => {
    if (psychologist) {
      loadSlots()
    }
  }, [psychologist, selectedProfessional, selectedCollaboratorId, selectedAppointmentType])

  async function checkAuthAndLoadData() {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    await loadPsychologist()
    await loadCollaborators()
    
    if (user) {
      await loadPatientData()
      await loadAppointmentHistory()
    }
    
    setLoading(false)
  }

  async function loadPatientData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const psychologistId = psychologist?.id
    if (!psychologistId) return

    const { data: patientData } = await supabase
      .from('patients')
      .select('id, full_name, email, phone, user_id')
      .eq('user_id', user.id)
      .eq('psychologist_id', psychologistId)
      .maybeSingle()

    if (patientData) {
      setPatient(patientData)
      setPatientForm({
        name: patientData.full_name || '',
        email: patientData.email || '',
        phone: patientData.phone || '',
      })
    }
  }

  async function loadAppointmentHistory() {
    const psychologistId = psychologist?.id
    if (!psychologistId || !patient?.id) return

    const { data } = await supabase
      .from('appointments')
      .select(`
        id,
        status,
        slot_id,
        slots(start_at, appointment_type),
        psychologists(full_name)
      `)
      .eq('patient_id', patient.id)
      .eq('psychologist_id', psychologistId)
      .in('status', ['scheduled', 'completed', 'cancelled'])
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setAppointmentHistory(data as any)
    }
  }

  async function loadPsychologist() {
    const { data } = await supabase
      .from('psychologists')
      .select('id, slug, full_name, crp, specialty, bio, default_session_price, session_duration_minutes, timezone')
      .eq('slug', slug)
      .eq('onboarding_completed', true)
      .single()

    if (!data) {
      router.push('/')
      return
    }

    setPsychologist(data)
  }

  async function loadCollaborators() {
    const psychologistId = psychologist?.id
    if (!psychologistId) return

    const { data } = await supabase
      .from('collaborators')
      .select('id, full_name, specialty, crp, bio')
      .eq('psychologist_id', psychologistId)
      .eq('is_active', true)
      .order('full_name')

    setCollaborators(data || [])
  }

  async function loadSlots() {
    if (!psychologist) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + 30)

    let query = supabase
      .from('slots')
      .select('id, start_at, appointment_type')
      .eq('psychologist_id', psychologist.id)
      .eq('status', 'available')
      .gte('start_at', today.toISOString())
      .lte('start_at', futureDate.toISOString())
      .order('start_at')

    if (selectedProfessional === 'collaborator' && selectedCollaboratorId) {
      query = query.eq('collaborator_id', selectedCollaboratorId)
    } else if (selectedProfessional === 'psychologist') {
      query = query.or('collaborator_id.is.null,collaborator_id.eq.' + psychologist.id)
    }

    const { data } = await query

    const filteredSlots = (data || []).filter(slot => {
      if (selectedAppointmentType === 'videoconferencia') {
        return slot.appointment_type === 'videoconferencia' || !slot.appointment_type
      }
      return true
    })

    setSlots(filteredSlots)
  }

  function selectProfessional(type: 'psychologist' | 'collaborator', collaboratorId?: string) {
    setSelectedProfessional(type)
    setSelectedCollaboratorId(collaboratorId || null)
    setSelectedSlot(null)
    setCurrentStep(3)
  }

  function selectSlot(slot: Slot) {
    setSelectedSlot(slot)
    setCurrentStep(4)
  }

  async function handleAuth() {
    setAuthLoading(true)
    setAuthError(null)

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              full_name: authForm.name,
              role: 'patient',
            },
          },
        })

        if (error) throw error

        if (data.user) {
          const psychologistId = psychologist?.id
          if (psychologistId) {
            await supabase.from('patients').insert({
              psychologist_id: psychologistId,
              user_id: data.user.id,
              full_name: authForm.name,
              email: authForm.email,
              phone: authForm.phone || null,
            })
          }
        }

        setSuccessMessage('Conta criada! Verifique seu email para confirmar.')
        setShowAuthModal(false)
        await checkAuthAndLoadData()
        setCurrentStep(2)
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        })

        if (error) throw error

        setShowAuthModal(false)
        await checkAuthAndLoadData()
        setCurrentStep(2)
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao processar')
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleSubmitPatient() {
    if (!patientForm.name || !patientForm.email || !selectedSlot) return

    setSaving(true)
    setError(null)

    const formData = new FormData()
    formData.append('slotId', selectedSlot.id)
    formData.append('name', patientForm.name)
    formData.append('email', patientForm.email)
    formData.append('phone', patientForm.phone || '')
    formData.append('consent', consentAccepted ? 'true' : 'false')
    formData.append('appointmentType', selectedAppointmentType)

    const result = await bookSlot(formData)

    if (result?.error) {
      setError(result.error)
      setSaving(false)
      await loadSlots()
      return
    }

    if (result?.paymentUrl) {
      window.location.href = result.paymentUrl
      return
    }

    router.push(`/p/${slug}/success?appointment=1`)
  }

  const timeZone = psychologist?.timezone || 'America/Sao_Paulo'

  const formatSlotDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  const formatSlotTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone
    })
  }

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const groupSlotsByDate = (slots: Slot[]) => {
    const grouped: Record<string, Slot[]> = {}
    
    for (const slot of slots) {
      const dateKey = new Date(slot.start_at).toDateString()
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(slot)
    }
    
    return Object.entries(grouped).slice(0, 14)
  }

  const groupedSlots = groupSlotsByDate(slots)

  const selectedProfessionalName = selectedProfessional === 'psychologist' 
    ? psychologist?.full_name 
    : collaborators.find(c => c.id === selectedCollaboratorId)?.full_name

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Link
          href={`/p/${slug}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-center mb-2">
            Agende sua sessão
          </h1>
          <p className="text-gray-600 text-center mb-8">
            com {psychologist?.full_name}
          </p>

          <div className="flex items-center justify-center mb-8">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-1 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {successMessage}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Identifique-se</h2>
              <p className="text-gray-600 text-sm mb-4">
                Faça login ou cadastre-se para continuar
              </p>

              {!showAuthModal ? (
                <div className="space-y-4">
                  <button
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true) }}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Já tenho conta - Entrar
                  </button>
                  <button
                    onClick={() => { setAuthMode('signup'); setShowAuthModal(true) }}
                    className="w-full py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    Criar conta nova
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {authError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                      {authError}
                    </div>
                  )}

                  {authMode === 'signup' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome completo
                        </label>
                        <input
                          type="text"
                          value={authForm.name}
                          onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="Seu nome completo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefone (para WhatsApp)
                        </label>
                        <input
                          type="tel"
                          value={authForm.phone}
                          onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha
                    </label>
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    onClick={handleAuth}
                    disabled={authLoading || !authForm.email || !authForm.password || (authMode === 'signup' && !authForm.name)}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {authLoading 
                      ? 'Processando...' 
                      : authMode === 'signup' 
                        ? 'Criar conta' 
                        : 'Entrar'}
                  </button>

                  <div className="text-center text-sm text-gray-600">
                    {authMode === 'signup' ? (
                      <>
                        Já tem conta?{' '}
                        <button onClick={() => setAuthMode('login')} className="text-blue-600 hover:underline">
                          Entre aqui
                        </button>
                      </>
                    ) : (
                      <>
                        Não tem conta?{' '}
                        <button onClick={() => setAuthMode('signup')} className="text-blue-600 hover:underline">
                          Cadastre-se
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => setShowAuthModal(false)}
                    className="w-full py-2 text-gray-500 hover:text-gray-700"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && user && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Escolha o profissional</h2>
              
              <button
                onClick={() => selectProfessional('psychologist')}
                className="w-full p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl text-blue-600 font-bold">
                      {psychologist?.full_name?.charAt(0) || 'P'}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{psychologist?.full_name}</div>
                    <div className="text-sm text-gray-500">Psicólogo(a) titular</div>
                    <div className="text-xs text-gray-400">CRP: {psychologist?.crp}</div>
                  </div>
                </div>
              </button>

              {collaborators.length > 0 && (
                <>
                  <div className="text-sm text-gray-500 mt-6 mb-2">Outros profissionais</div>
                  {collaborators.map((collaborator) => (
                    <button
                      key={collaborator.id}
                      onClick={() => selectProfessional('collaborator', collaborator.id)}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-xl text-green-600 font-bold">
                            {collaborator.full_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{collaborator.full_name}</div>
                          <div className="text-sm text-gray-500">{collaborator.specialty}</div>
                          <div className="text-xs text-gray-400">CRP: {collaborator.crp}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="text-blue-600 hover:underline text-sm mb-4"
              >
                ← Escolher outro profissional
              </button>

              <h2 className="text-lg font-semibold mb-4">
                Horários disponíveis com {selectedProfessionalName}
              </h2>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de atendimento
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedAppointmentType('presencial')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                      selectedAppointmentType === 'presencial'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">Presencial</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedAppointmentType('videoconferencia')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                      selectedAppointmentType === 'videoconferencia'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">Vídeo</span>
                    </div>
                  </button>
                </div>
              </div>

              {groupedSlots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum horário disponível para este tipo de atendimento
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedSlots.map(([dateKey, daySlots]) => (
                    <div key={dateKey} className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">
                        {formatSlotDate(daySlots[0].start_at)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {daySlots.slice(0, 10).map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => selectSlot(slot)}
                            className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors"
                          >
                            {formatSlotTime(slot.start_at)}
                          </button>
                        ))}
                        {daySlots.length > 10 && (
                          <span className="px-4 py-2 text-gray-500 text-sm">
                            +{daySlots.length - 10} mais
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <button
                onClick={() => setCurrentStep(3)}
                className="text-blue-600 hover:underline text-sm mb-4"
              >
                ← Escolher outro horário
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-600 mb-1">Horário selecionado</div>
                <div className="text-lg font-semibold text-blue-900">
                  {selectedSlot && formatFullDate(selectedSlot.start_at)} às {selectedSlot && formatSlotTime(selectedSlot.start_at)}
                </div>
                <div className="text-sm text-blue-700 flex items-center gap-2 mt-1">
                  {selectedAppointmentType === 'videoconferencia' ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Videoconferência
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Presencial
                    </>
                  )}
                </div>
                <div className="text-sm text-blue-700">com {selectedProfessionalName}</div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Seus dados</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome completo *
                    </label>
                    <input
                      type="text"
                      value={patientForm.name}
                      onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
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
                      value={patientForm.email}
                      onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone (WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      value={patientForm.phone}
                      onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(e) => setConsentAccepted(e.target.checked)}
                    className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
                  />
                  <span className="text-sm text-gray-600">
                    Eu li e concordo com a{' '}
                    <a href="/minha-conta/privacidade" target="_blank" className="text-blue-600 hover:underline">Política de Privacidade</a>
                    {' '}e os{' '}
                    <a href="/minha-conta/privacidade" target="_blank" className="text-blue-600 hover:underline">Termos de Uso</a>.
                  </span>
                </label>
              </div>

              <button
                onClick={handleSubmitPatient}
                disabled={saving || !patientForm.name || !patientForm.email || !patientForm.phone || !consentAccepted}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Agendando...' : 'Confirmar agendamento'}
              </button>
            </div>
          )}
        </div>

        {appointmentHistory.length > 0 && currentStep >= 2 && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Seu histórico de consultas</h3>
            <div className="space-y-3">
              {appointmentHistory.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {apt.slots?.[0] && formatFullDate(apt.slots[0].start_at)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {apt.psychologists?.[0]?.full_name}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {apt.status === 'scheduled' ? 'Agendada' :
                     apt.status === 'completed' ? 'Concluída' : 'Cancelada'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
