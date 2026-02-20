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
    .select('id, full_name, crp, specialty, bio')
    .eq('slug', slug)
    .eq('onboarding_completed', true)
    .single()

  if (error || !psychologist) {
    notFound()
  }

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

          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold text-center mb-4">
              Agende sua sessão
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Crie uma conta para agendar suas sessões com {psychologist.full_name}.
            </p>
            <Link
              href={`/p/${slug}/signup`}
              className="block w-full py-3 px-4 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors"
            >
              Criar conta de paciente
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
