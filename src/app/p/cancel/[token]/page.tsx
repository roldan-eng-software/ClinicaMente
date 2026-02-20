'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function CancelPage() {
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'already_cancelled' | 'too_late' | 'success'>('loading')
  const [appointment, setAppointment] = useState<any>(null)
  const [psychologist, setPsychologist] = useState<any>(null)

  useState(() => {
    async function checkToken() {
      const { data: reminder, error } = await supabase
        .from('reminders')
        .select(`
          id,
          status,
          cancel_token,
          appointments:appointments(
            id,
            status,
            scheduled_at,
            psychologists:psychologists(full_name, slug, cancellation_policy_hours)
          )
        `)
        .eq('cancel_token', token)
        .single()

      if (error || !reminder) {
        setStatus('invalid')
        return
      }

      if (reminder.status === 'cancelled_by_patient') {
        setStatus('already_cancelled')
        return
      }

      const apt: any = reminder.appointments
      const psy = apt?.psychologists
      const cancellationHours = psy?.[0]?.cancellation_policy_hours || 24

      const appointmentDate = new Date(apt?.scheduled_at)
      const now = new Date()
      const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      if (hoursUntilAppointment < cancellationHours) {
        setStatus('too_late')
        return
      }

      setAppointment(apt)
      setPsychologist(psy?.[0])
      setStatus('valid')
    }

    checkToken()
  })

  async function handleCancel() {
    setLoading(true)

    const { data: reminder } = await supabase
      .from('reminders')
      .select('appointment_id')
      .eq('cancel_token', token)
      .single()

    if (!reminder) {
      setStatus('invalid')
      setLoading(false)
      return
    }

    const reminderData: any = reminder
    await supabase
      .from('reminders')
      .update({ status: 'cancelled_by_patient' })
      .eq('id', reminderData.id)

    const { data: apt } = await supabase
      .from('appointments')
      .select('slot_id')
      .eq('id', reminder.appointment_id)
      .single()

    if (apt?.slot_id) {
      await supabase
        .from('slots')
        .update({ status: 'available' })
        .eq('id', apt.slot_id)
    }

    await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', reminder.appointment_id)

    setLoading(false)
    setStatus('success')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Verificando...</div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link inválido</h1>
          <p className="text-gray-600">Este link de cancelamento não é válido ou já foi utilizado.</p>
        </div>
      </div>
    )
  }

  if (status === 'already_cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Já cancelado</h1>
          <p className="text-gray-600">Esta consulta já foi cancelada anteriormente.</p>
        </div>
      </div>
    )
  }

  if (status === 'too_late') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cancelamento não permitido</h1>
          <p className="text-gray-600">
            O prazo mínimo para cancelamento é de {psychologist?.cancellation_policy_hours || 24} horas antes da consulta.
            Esta consulta não pode mais ser cancelada online.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Entre em contato diretamente com o psicólogo.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Consulta cancelada</h1>
          <p className="text-gray-600 mb-4">
            Sua consulta com {psychologist?.full_name} foi cancelada com sucesso.
          </p>
          {psychologist?.slug && (
            <Link
              href={`/p/${psychologist.slug}`}
              className="text-blue-600 hover:underline"
            >
              Voltar para página do psicólogo
            </Link>
          )}
        </div>
      </div>
    )
  }

  const appointmentDate = appointment ? new Date(appointment.scheduled_at) : null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Cancelar consulta</h1>
        <p className="text-gray-600 mb-4">
          Deseja cancelar sua consulta com {psychologist?.full_name}?
        </p>
        {appointmentDate && (
          <p className="text-sm text-gray-500 mb-6">
            Data: {appointmentDate.toLocaleString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}
        <button
          onClick={handleCancel}
          disabled={loading}
          className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 mb-3"
        >
          {loading ? 'Cancelando...' : 'Sim, cancelar consulta'}
        </button>
        {psychologist?.slug && (
          <Link
            href={`/p/${psychologist.slug}`}
            className="text-gray-600 hover:underline text-sm block"
          >
            Voltar
          </Link>
        )}
      </div>
    </div>
  )
}
