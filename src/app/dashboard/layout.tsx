import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DashboardProvider } from './context'
import { DashboardNav } from './dashboard-nav'

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
    .select('id, full_name, slug, timezone, onboarding_completed, plan, plan_expires_at')
    .eq('user_id', user.id)
    .single()

  const now = new Date()
  const planExpired = psychologist?.plan_expires_at && new Date(psychologist.plan_expires_at) < now
  const plan = planExpired ? 'free' : (psychologist?.plan || 'free')

  if (error || !psychologist) {
    redirect('/login')
  }

  if (!psychologist.onboarding_completed) {
    redirect('/onboarding')
  }

  return (
    <DashboardProvider psychologist={{ ...psychologist, plan }}>
      <div className="min-h-screen bg-gray-50">
        <DashboardNav psychologist={psychologist} plan={plan} />
        
        <main className="lg:pl-64 px-4 sm:px-6 lg:px-8 py-6 pt-20 lg:pt-6">
          {children}
        </main>
      </div>
    </DashboardProvider>
  )
}
