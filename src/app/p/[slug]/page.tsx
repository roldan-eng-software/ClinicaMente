import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function PsychologistPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient()

  const { data: psychologist, error } = await supabase
    .from('psychologists')
    .select('full_name, crp, specialty, bio, default_session_price, session_duration_minutes, timezone')
    .eq('slug', slug)
    .eq('onboarding_completed', true)
    .single()

  if (error || !psychologist) {
    notFound()
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + 14)

  const { data: slots } = await supabase
    .from('slots')
    .select('scheduled_at')
    .eq('psychologist_id', (
      await supabase
        .from('psychologists')
        .select('id')
        .eq('slug', slug)
        .single()
    ).data?.id || '')
    .eq('status', 'available')
    .gte('scheduled_at', today.toISOString())
    .lte('scheduled_at', futureDate.toISOString())
    .order('scheduled_at')
    .limit(20)

  const timeZone = psychologist.timezone || 'America/Sao_Paulo'

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

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

  const groupSlotsByDate = (slots: { scheduled_at: string }[]) => {
    const grouped: Record<string, { scheduled_at: string }[]> = {}
    
    for (const slot of slots) {
      const dateKey = new Date(slot.scheduled_at).toDateString()
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(slot)
    }
    
    return Object.entries(grouped).slice(0, 7)
  }

  const groupedSlots = slots ? groupSlotsByDate(slots) : []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl text-blue-600">
                {psychologist.full_name?.charAt(0) || 'P'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {psychologist.full_name}
            </h1>
            {psychologist.crp && (
              <p className="text-gray-600">CRP: {psychologist.crp}</p>
            )}
          </div>

          {psychologist.specialty && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-500 uppercase mb-2">
                Especialidade
              </h2>
              <p className="text-gray-900">{psychologist.specialty}</p>
            </div>
          )}

          {psychologist.bio && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-gray-500 uppercase mb-2">
                Sobre
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">{psychologist.bio}</p>
            </div>
          )}

          <div className="border-t pt-6 mb-8">
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {psychologist.default_session_price 
                    ? formatCurrency(psychologist.default_session_price)
                    : 'R$ 150'}
                </div>
                <div className="text-sm text-gray-500">por sessão</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {psychologist.session_duration_minutes || 50}
                </div>
                <div className="text-sm text-gray-500">minutos</div>
              </div>
            </div>
          </div>

          {groupedSlots.length > 0 && (
            <div className="border-t pt-6 mb-6">
              <h2 className="text-lg font-semibold text-center mb-4">
                Próximos horários disponíveis
              </h2>
              <div className="space-y-3">
                {groupedSlots.map(([dateKey, daySlots]) => (
                  <div key={dateKey} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      {formatSlotDate(daySlots[0].scheduled_at)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.slice(0, 6).map((slot, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-white border border-blue-200 text-blue-700 text-sm rounded-full"
                        >
                          {formatSlotTime(slot.scheduled_at)}
                        </span>
                      ))}
                      {daySlots.length > 6 && (
                        <span className="px-3 py-1 text-gray-500 text-sm">
                          +{daySlots.length - 6} mais
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {groupedSlots.length === 0 && (
            <div className="border-t pt-6 mb-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-800">
                  Nenhum horário disponível no momento. Entre em contato.
                </p>
              </div>
            </div>
          )}

          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold text-center mb-4">
              Agende sua sessão
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Crie uma conta de paciente para agendar suas sessões com {psychologist.full_name}.
            </p>
            <Link
              href={`/p/${slug}/book`}
              className="block w-full py-3 px-4 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors"
            >
              Agendar agora
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
