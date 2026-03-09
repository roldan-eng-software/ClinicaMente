import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardProvider } from './context'
import { DashboardNav } from './dashboard-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const psychologist = await prisma.psychologist.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      fullName: true,
      slug: true,
      timezone: true,
      plan: true,
      onboardingCompleted: true,
      clinicName: true,
      clinicAddress: true,
      clinicPhone: true,
      clinicEmail: true,
      primaryColor: true,
      secondaryColor: true,
    },
  })

  if (!psychologist) {
    redirect('/onboarding')
  }

  if (!psychologist.onboardingCompleted) {
    redirect('/onboarding')
  }

  const dashboardUser = {
    id: psychologist.id,
    full_name: psychologist.fullName,
    slug: psychologist.slug,
    timezone: psychologist.timezone,
    plan: psychologist.plan,
    clinic_name: psychologist.clinicName || undefined,
    clinic_address: psychologist.clinicAddress || undefined,
    clinic_phone: psychologist.clinicPhone || undefined,
    clinic_email: psychologist.clinicEmail || undefined,
    primary_color: psychologist.primaryColor || undefined,
    secondary_color: psychologist.secondaryColor || undefined,
  }

  return (
    <DashboardProvider psychologist={dashboardUser}>
      <div className="min-h-screen bg-gray-50">
        <DashboardNav psychologist={dashboardUser} plan={psychologist.plan} />
        
        <main className="lg:pl-24 px-4 sm:px-6 lg:px-8 py-6 pt-20 lg:pt-6">
          {children}
        </main>
      </div>
    </DashboardProvider>
  )
}
