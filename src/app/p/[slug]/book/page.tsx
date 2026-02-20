'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { bookSlot } from '@/app/actions/book-slot'

interface Slot {
  id: string
  start_at: string
}

interface Psychologist {
  slug: string
  full_name: string
  crp: string
  specialty: string
  bio: string
  default_session_price: number
  session_duration_minutes: number
  timezone: string
}

export default function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [psychologist, setPsychologist] = useState<Psychologist | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [checkingSlot, setCheckingSlot] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  const [user, setUser] = useState<any>(null)
  const [patientForm, setPatientForm] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consentAccepted, setConsentAccepted] = useState(false)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [slug])

  async function checkAuthAndLoadData() {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('full_name, email, phone')
        .eq('user_id', user.id)
        .maybeSingle()

      if (patientError) {
        console.error('Erro ao buscar paciente:', patientError)
      }

      if (patient) {
        setPatientForm({
          name: patient.full_name || '',
          email: patient.email || '',
          phone: patient.phone || '',
        })
      }
    }

    await loadPsychologist()
    await loadSlots()
    
    setLoading(false)
  }

  async function loadPsychologist() {
    const { data } = await supabase
      .from('psychologists')
      .select('slug, full_name, crp, specialty, bio, default_session_price, session_duration_minutes, timezone')
      .eq('slug', slug)
      .eq('onboarding_completed', true)
      .single()

    if (!data) {
      router.push('/')
      return
    }

    setPsychologist(data)
  }

  async function loadSlots() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + 14)

    const { data } = await supabase
      .from('slots')
      .select('id, start_at')
      .eq('psychologist_id', (
        await supabase
          .from('psychologists')
          .select('id')
          .eq('slug', slug)
          .single()
      ).data?.id || '')
      .eq('status', 'available')
      .gte('start_at', today.toISOString())
      .lte('start_at', futureDate.toISOString())
      .order('start_at')

    setSlots(data || [])
  }

  async function selectSlot(slot: Slot) {
    setCheckingSlot(true)
    setError(null)

    const { data: currentSlot } = await supabase
      .from('slots')
      .select('status')
      .eq('id', slot.id)
      .single()

    if (!currentSlot || currentSlot.status !== 'available') {
      setError('Este horário acabou de ser reservado por outro paciente. Por favor, escolha outro.')
      await loadSlots()
      setCheckingSlot(false)
      return
    }

    if (!user) {
      setShowAuthModal(true)
      setCheckingSlot(false)
      return
    }

    setSelectedSlot(slot)
    setCheckingSlot(false)
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

  const groupSlotsByDate = (slots: Slot[]) => {
    const grouped: Record<string, Slot[]> = {}
    
    for (const slot of slots) {
      const dateKey = new Date(slot.start_at).toDateString()
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(slot)
    }
    
    return Object.entries(grouped).slice(0, 7)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  const groupedSlots = groupSlotsByDate(slots)

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

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-2">
            Agende sua sessão
          </h1>
          <p className="text-gray-600 text-center mb-8">
            com {psychologist?.full_name}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {!selectedSlot ? (
            <>
              <h2 className="text-lg font-semibold mb-4">Escolha um horário</h2>
              
              {groupedSlots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum horário disponível no momento
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedSlots.map(([dateKey, daySlots]) => (
                    <div key={dateKey} className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">
                        {formatSlotDate(daySlots[0].start_at)}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {daySlots.slice(0, 8).map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => selectSlot(slot)}
                            disabled={checkingSlot}
                            className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors disabled:opacity-50"
                          >
                            {formatSlotTime(slot.start_at)}
                          </button>
                        ))}
                        {daySlots.length > 8 && (
                          <span className="px-4 py-2 text-gray-500 text-sm">
                            +{daySlots.length - 8} mais
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-600 mb-1">Horário selecionado</div>
                <div className="text-lg font-semibold text-blue-900">
                  {formatSlotDate(selectedSlot.start_at)} às {formatSlotTime(selectedSlot.start_at)}
                </div>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="text-sm text-blue-600 hover:underline mt-2"
                >
                  Alterar horário
                </button>
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
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={patientForm.phone}
                      onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(11) 99999-9999"
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
                    <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">Política de Privacidade</a>
                    {' '}e os{' '}
                    <a href="/terms" target="_blank" className="text-blue-600 hover:underline">Termos de Uso</a>.
                    <br />
                    <span className="text-xs text-gray-500">
                      Para confirmar o agendamento, é necessário aceitar os termos.
                    </span>
                  </span>
                </label>
              </div>

              <button
                onClick={handleSubmitPatient}
                disabled={saving || !patientForm.name || !patientForm.email || !consentAccepted}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Agendando...' : 'Confirmar agendamento'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Faça login ou cadastre-se</h3>
            <p className="text-gray-600 mb-6">
              Você precisa de uma conta para agendar. Você pode fazer login ou criar uma nova conta.
            </p>
            <div className="flex space-x-3">
              <Link
                href={`/p/${slug}/login?slot=${selectedSlot?.id}`}
                className="flex-1 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700"
              >
                Fazer login
              </Link>
              <Link
                href={`/p/${slug}/signup?slot=${selectedSlot?.id}`}
                className="flex-1 py-3 border border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-50"
              >
                Criar conta
              </Link>
            </div>
            <button
              onClick={() => setShowAuthModal(false)}
              className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
