import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DashboardProvider } from './context'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: psychologist, error } = await supabase
    .from('psychologists')
    .select('id, full_name, slug, timezone, onboarding_completed')
    .eq('user_id', user.id)
    .single()

  if (error || !psychologist) {
    redirect('/login')
  }

  if (!psychologist.onboarding_completed) {
    redirect('/onboarding')
  }

  return (
    <DashboardProvider psychologist={psychologist}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                  ClínicaMente
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href={`/p/${psychologist.slug}`}
                  target="_blank"
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  Ver página pública
                </Link>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {psychologist.full_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 py-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Início
            </Link>
            <Link
              href="/dashboard/schedule"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Agenda
            </Link>
            <Link
              href="/dashboard/patients"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Pacientes
            </Link>
            <Link
              href="/dashboard/financial"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Financeiro
            </Link>
            <Link
              href="/dashboard/availability"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Disponibilidade
            </Link>
            <Link
              href="/dashboard/records"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Prontuário
            </Link>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {children}
        </main>
      </div>
    </DashboardProvider>
  )
}
