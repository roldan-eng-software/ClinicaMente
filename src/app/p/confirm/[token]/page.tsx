import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ConfirmPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  const { data: reminder, error } = await supabase
    .from('reminders')
    .select(`
      id,
      status,
      confirm_token,
      appointment_id,
      appointments:appointments(
        id,
        status,
        scheduled_at,
        psychologists:psychologists(full_name, slug, cancellation_policy_hours)
      )
    `)
    .eq('confirm_token', token)
    .single()

  if (error || !reminder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link inválido</h1>
          <p className="text-gray-600">Este link de confirmação não é válido ou já foi utilizado.</p>
        </div>
      </div>
    )
  }

  if (reminder.status !== 'pending' && reminder.status !== 'sent') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Já confirmado</h1>
          <p className="text-gray-600">Esta consulta já foi confirmada anteriormente.</p>
        </div>
      </div>
    )
  }

  const appointment = reminder.appointments as any
  const psychologist = appointment?.psychologists

  await supabase
    .from('reminders')
    .update({ status: 'confirmed_by_patient' })
    .eq('id', reminder.id)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Consulta confirmada!</h1>
        <p className="text-gray-600 mb-4">
          Sua consulta com {psychologist?.full_name} foi confirmada.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Data: {new Date(appointment?.scheduled_at).toLocaleString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
          })}
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
