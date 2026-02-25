'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePsychologist } from '@/app/dashboard/context'

interface Appointment {
  id: string
  patient_id: string
  slot_id: string
  status: string
  payment_status: string
  created_at: string
  slot?: {
    start_at: string
    end_at: string
  }
  patient?: {
    full_name: string
    email: string
    phone: string
  }
}

export function UpcomingSessionsTable() {
  const psychologist = usePsychologist()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    loadAppointments()
  }, [psychologist.id])

  async function loadAppointments() {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        slot_id,
        status,
        payment_status,
        created_at,
        slots:slot_id(start_at, end_at),
        patients:patient_id(full_name, email, phone)
      `)
      .eq('psychologist_id', psychologist.id)
      .eq('status', 'confirmed')
      .gte('slots.start_at', new Date().toISOString())
      .order('slots.start_at', { ascending: true })
      .limit(5)

    if (!error && data) {
      setAppointments(data.map((a: any) => ({
        ...a,
        slot: a.slots?.[0] || null,
        patient: a.patients?.[0] || null
      })))
    }
    
    setLoading(false)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      confirmed: 'Confirmada',
      pending: 'Pendente',
      completed: 'Concluída',
      cancelled: 'Cancelada',
    }
    return labels[status] || status
  }

  const getPaymentLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Pago',
      pending: 'Pendente',
      refunded: 'Reembolsado',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Próximas Sessões</h2>
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Próximas Sessões</h2>
        
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma sessão agendada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">
                      {appointment.patient?.full_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {appointment.slot ? formatDate(appointment.slot.start_at) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{appointment.patient?.phone || '-'}</div>
                      <div className="text-xs">{appointment.patient?.email || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.payment_status)}`}>
                        {getPaymentLabel(appointment.payment_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusLabel(appointment.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
