'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Step = 'clinic' | 'financial' | 'availability' | 'confirmation'

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<Step>('clinic')
  const [user, setUser] = useState<any>(null)
  const [psychologist, setPsychologist] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    fullName: '',
    slug: '',
    crp: '',
    specialty: '',
    bio: '',
    sessionPrice: '150',
    sessionDuration: '50',
    cancellationPolicy: '24',
    timezone: 'America/Sao_Paulo',
  })

  const [availability, setAvailability] = useState([
    { day: 1, start: '09:00', end: '12:00', enabled: true },
    { day: 2, start: '09:00', end: '12:00', enabled: true },
    { day: 3, start: '09:00', end: '12:00', enabled: true },
    { day: 4, start: '09:00', end: '12:00', enabled: true },
    { day: 5, start: '09:00', end: '12:00', enabled: false },
    { day: 6, start: '09:00', end: '12:00', enabled: false },
    { day: 0, start: '09:00', end: '12:00', enabled: false },
  ])

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: psychologistData } = await supabase
        .from('psychologists')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (psychologistData?.onboarding_completed) {
        router.push('/dashboard')
        return
      }

      if (psychologistData) {
        setFormData(prev => ({
          ...prev,
          fullName: psychologistData.full_name || '',
          crp: psychologistData.crp || '',
          specialty: psychologistData.specialty || '',
          bio: psychologistData.bio || '',
          sessionPrice: String(psychologistData.default_session_price || '150'),
          sessionDuration: String(psychologistData.session_duration_minutes || '50'),
          cancellationPolicy: String(psychologistData.cancellation_policy_hours || '24'),
          timezone: psychologistData.timezone || 'America/Sao_Paulo',
        }))
      }

      setPsychologist(psychologistData)
      setLoading(false)
    }

    checkUser()
  }, [supabase, router])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const validateClinicStep = () => {
    if (!formData.fullName || !formData.crp || !formData.slug) {
      setError('Preencha todos os campos obrigatórios')
      return false
    }
    return true
  }

  const validateFinancialStep = () => {
    if (!formData.sessionPrice || !formData.sessionDuration) {
      setError('Preencha os valores obrigatórios')
      return false
    }
    return true
  }

  const handleNext = () => {
    setError(null)
    
    if (step === 'clinic' && !validateClinicStep()) return
    if (step === 'financial' && !validateFinancialStep()) return
    
    const steps: Step[] = ['clinic', 'financial', 'availability', 'confirmation']
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const handleBack = () => {
    setError(null)
    const steps: Step[] = ['clinic', 'financial', 'availability', 'confirmation']
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)

    const { data: existing } = await supabase
      .from('psychologists')
      .select('id')
      .eq('slug', formData.slug)
      .neq('user_id', user.id)
      .single()

    if (existing) {
      setError('Este URL já está em uso. Escolha outro.')
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase
      .from('psychologists')
      .update({
        full_name: formData.fullName,
        slug: formData.slug,
        crp: formData.crp,
        specialty: formData.specialty,
        bio: formData.bio,
        default_session_price: parseFloat(formData.sessionPrice),
        session_duration_minutes: parseInt(formData.sessionDuration),
        cancellation_policy_hours: parseInt(formData.cancellationPolicy),
        timezone: formData.timezone,
        onboarding_completed: true,
      })
      .eq('user_id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    const enabledDays = availability.filter(d => d.enabled)
    if (enabledDays.length > 0) {
      const rules = enabledDays.map(d => ({
        psychologist_id: psychologist.id,
        day_of_week: d.day,
        start_time: d.start,
        end_time: d.end,
        is_active: true,
      }))

      await supabase.from('availability_rules').insert(rules)
    }

    router.push('/dashboard')
  }

  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Configure seu perfil</h1>
          <p className="text-center text-gray-600 mb-8">
            Passo {['clinic', 'financial', 'availability', 'confirmation'].indexOf(step) + 1} de 4
          </p>

          <div className="mb-8">
            <div className="flex items-center justify-between">
              {['clinic', 'financial', 'availability', 'confirmation'].map((s, i) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    step === s ? 'bg-blue-600 text-white' :
                    ['clinic', 'financial', 'availability', 'confirmation'].indexOf(step) > i ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {['clinic', 'financial', 'availability', 'confirmation'].indexOf(step) > i ? '✓' : i + 1}
                  </div>
                  {i < 3 && <div className={`w-12 h-1 mx-1 ${
                    ['clinic', 'financial', 'availability', 'confirmation'].indexOf(step) > i ? 'bg-green-500' : 'bg-gray-200'
                  }`} />}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          {step === 'clinic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value })
                    if (!formData.slug) {
                      setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL pública *
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                    clinicamente.app/p/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-blue-500"
                    placeholder="seu-nome"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CRP *
                </label>
                <input
                  type="text"
                  value={formData.crp}
                  onChange={(e) => setFormData({ ...formData, crp: e.target.value })}
                  placeholder="06/123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidade
                </label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="Psicologia Clínica, TCC..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio (para página pública)
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  placeholder="Conte sobre sua experiência..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {step === 'financial' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor da sessão (R$) *
                </label>
                <input
                  type="number"
                  value={formData.sessionPrice}
                  onChange={(e) => setFormData({ ...formData, sessionPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duração da sessão (minutos) *
                </label>
                <select
                  value={formData.sessionDuration}
                  onChange={(e) => setFormData({ ...formData, sessionDuration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                >
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="50">50 minutos</option>
                  <option value="60">60 minutos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Política de cancelamento (horas antes)
                </label>
                <select
                  value={formData.cancellationPolicy}
                  onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                >
                  <option value="12">12 horas</option>
                  <option value="24">24 horas</option>
                  <option value="48">48 horas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuso horário
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                >
                  <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                  <option value="America/Manaus">Manaus (GMT-4)</option>
                  <option value="America/Recife">Recife (GMT-3)</option>
                </select>
              </div>
            </div>
          )}

          {step === 'availability' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Configure sua disponibilidade semanal. Clique em cada dia para ativar/desativar.
              </p>

              {availability.map((day) => (
                <div key={day.day} className={`p-4 border rounded-lg ${day.enabled ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.enabled}
                        onChange={(e) => {
                          const newAvailability = [...availability]
                          newAvailability[day.day] = { ...day, enabled: e.target.checked }
                          setAvailability(newAvailability)
                        }}
                        className="mr-3 h-4 w-4 text-blue-600"
                      />
                      <span className="font-medium">{dayNames[day.day]}</span>
                    </label>
                    
                    {day.enabled && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={day.start}
                          onChange={(e) => {
                            const newAvailability = [...availability]
                            newAvailability[day.day] = { ...day, start: e.target.value }
                            setAvailability(newAvailability)
                          }}
                          className="px-2 py-1 border rounded text-sm"
                        />
                        <span className="text-gray-400">às</span>
                        <input
                          type="time"
                          value={day.end}
                          onChange={(e) => {
                            const newAvailability = [...availability]
                            newAvailability[day.day] = { ...day, end: e.target.value }
                            setAvailability(newAvailability)
                          }}
                          className="px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 'confirmation' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Revise suas configurações</h3>

              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <span className="text-gray-500">Nome:</span>
                  <span className="ml-2 font-medium">{formData.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-500">CRP:</span>
                  <span className="ml-2 font-medium">{formData.crp}</span>
                </div>
                <div>
                  <span className="text-gray-500">URL pública:</span>
                  <span className="ml-2 font-medium">clinicamente.app/p/{formData.slug}</span>
                </div>
                <div>
                  <span className="text-gray-500">Valor da sessão:</span>
                  <span className="ml-2 font-medium">R$ {formData.sessionPrice},00</span>
                </div>
                <div>
                  <span className="text-gray-500">Duração:</span>
                  <span className="ml-2 font-medium">{formData.sessionDuration} minutos</span>
                </div>
                <div>
                  <span className="text-gray-500">Disponibilidade:</span>
                  <span className="ml-2 font-medium">
                    {availability.filter(d => d.enabled).map(d => dayNames[d.day]).join(', ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step !== 'clinic' && (
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Voltar
              </button>
            )}
            
            {step === 'confirmation' ? (
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 ml-auto"
              >
                {saving ? 'Salvando...' : 'Finalizar'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ml-auto"
              >
                Continuar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
