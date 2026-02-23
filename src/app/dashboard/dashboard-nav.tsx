'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { usePsychologist } from './context'

const navItems = [
  { href: '/dashboard', label: 'Início', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/dashboard/schedule', label: 'Agenda', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/dashboard/patients', label: 'Pacientes', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { href: '/dashboard/financial', label: 'Financeiro', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/dashboard/availability', label: 'Disponibilidade', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/dashboard/records', label: 'Prontuário', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]

interface DashboardNavProps {
  psychologist: {
    full_name: string
    slug: string
  }
  plan: string
}

export function DashboardNav({ psychologist, plan }: DashboardNavProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const handleNavigate = (href: string) => {
    router.push(href)
  }

  const NavButton = ({ item, mobile = false }: { item: typeof navItems[0]; mobile?: boolean }) => (
    <button
      onClick={() => handleNavigate(item.href)}
      className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors text-left ${
        pathname === item.href
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:bg-gray-100'
      } ${mobile ? '' : 'shadow-sm border border-gray-200'}`}
    >
      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
      </svg>
      {item.label}
    </button>
  )

  const UpgradeButton = ({ mobile = false }: { mobile?: boolean }) => (
    <button
      onClick={() => handleNavigate('/dashboard/upgrade')}
      className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors text-left text-blue-600 ${
        mobile ? '' : 'shadow-sm border border-blue-200 bg-blue-50'
      }`}
    >
      <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
      Upgrade
    </button>
  )

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-sm">
        <div className="flex items-center justify-between h-16 px-4">
          <button onClick={() => handleNavigate('/dashboard')} className="text-xl font-bold text-blue-600">
            ClínicaMente
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div 
        className={`lg:hidden fixed inset-0 z-30 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className={`absolute top-16 left-0 bottom-0 w-72 bg-white shadow-lg transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {psychologist.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <div className="font-medium text-gray-900">{psychologist.full_name}</div>
              </div>
            </div>
            
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavButton key={item.href} item={item} mobile />
              ))}
              {plan === 'free' && <UpgradeButton mobile />}
            </nav>

            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => window.open(`/p/${psychologist.slug}`, '_blank')}
                className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Ver página pública
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:bg-white lg:shadow-sm lg:z-30">
        <div className="flex items-center h-16 px-6 border-b">
          <button onClick={() => handleNavigate('/dashboard')} className="text-xl font-bold text-blue-600">
            ClínicaMente
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-center mb-6 p-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {psychologist.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <div className="font-medium text-gray-900 text-sm">{psychologist.full_name}</div>
            </div>
          </div>
          
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavButton key={item.href} item={item} />
            ))}
            {plan === 'free' && <UpgradeButton />}
          </nav>

          <div className="mt-6 pt-4 border-t">
            <button
              onClick={() => window.open(`/p/${psychologist.slug}`, '_blank')}
              className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver página pública
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
