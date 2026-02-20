'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'

export default function PatientDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [patient, setPatient] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [psychologist, setPsychologist] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string
  const supabase = createClient()

  useEffect(() => {
    async function checkPatient() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/p/${slug}/login`)
        return
      }

      const { data: patientData } = await supabase
        .from('patients')
        .select('*, psychologists!inner(full_name)')
        .eq('user_id', user.id)
        .single()

      if (!patientData) {
        router.push(`/p/${slug}/login`)
        return
      }

      setPatient(patientData)
      setPsychologist(patientData.psychologists)

      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*, slots(start_at, end_at)')
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setAppointments(appointmentsData || [])
      setLoading(false)
    }

    checkPatient()
  }, [slug, supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push(`/p/${slug}/login`)
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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {patient?.full_name}
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Seu psicólogo</h2>
            <p className="text-gray-700">{psychologist?.full_name}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Próximas consultas</h2>
            {appointments.length === 0 ? (
              <p className="text-gray-500">Nenhuma consulta agendada.</p>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div key={apt.id} className="border-b pb-4 last:border-b-0">
                    <p className="font-medium">
                      {new Date(apt.slots?.start_at).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(apt.slots?.start_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                      apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {apt.status === 'confirmed' ? 'Confirmada' :
                       apt.status === 'pending' ? 'Pendente' :
                       apt.status === 'cancelled' ? 'Cancelada' :
                       'Concluída'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
