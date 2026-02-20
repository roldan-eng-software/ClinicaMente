'use client'

import { createContext, useContext, ReactNode } from 'react'

interface Psychologist {
  id: string
  full_name: string
  slug: string
  timezone: string
  plan?: string
}

interface DashboardContextType {
  psychologist: Psychologist | null
}

const DashboardContext = createContext<DashboardContextType>({
  psychologist: null,
})

export function DashboardProvider({
  children,
  psychologist,
}: {
  children: ReactNode
  psychologist: Psychologist
}) {
  return (
    <DashboardContext.Provider value={{ psychologist }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function usePsychologist() {
  const context = useContext(DashboardContext)
  if (!context.psychologist) {
    throw new Error('usePsychologist must be used within DashboardProvider')
  }
  return context.psychologist
}
