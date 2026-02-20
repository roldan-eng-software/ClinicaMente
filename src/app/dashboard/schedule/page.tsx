'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePsychologist } from '../context'

interface Slot {
  id: string
  scheduled_at: string
  status: string
  patient_id?: string
  patient?: {
    name: string
    email: string
  }
}

interface DaySchedule {
  date: Date
  slots: Slot[]
}

export default function SchedulePage() {
  const psychologist = usePsychologist()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadSlots()
  }, [currentDate, viewMode])

  async function loadSlots() {
    setLoading(true)
    
    const start = new Date(currentDate)
    const end = new Date(currentDate)
    
    if (viewMode === 'week') {
      start.setDate(start.getDate() - start.getDay())
      end.setDate(end.getDate() + (6 - end.getDay()))
    } else {
      start.setDate(1)
      end.setMonth(end.getMonth() + 1, 0)
    }
    
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('slots')
      .select(`
        id,
        scheduled_at,
        status,
        patient_id,
        patients:patient_id (
          name,
          email
        )
      `)
      .eq('psychologist_id', psychologist.id)
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .order('scheduled_at')

    if (!error && data) {
      const formattedSlots = data.map((slot: any) => ({
        ...slot,
        patient: slot.patients?.[0] || null
      }))
      setSlots(formattedSlots)
    }
    
    setLoading(false)
  }

  const timeZone = psychologist.timezone || 'America/Sao_Paulo'

  function toLocalTime(utcDateStr: string): { date: Date; time: string } {
    const date = new Date(utcDateStr)
    const time = date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone 
    })
    return { date, time }
  }

  const weekDays = useMemo(() => {
    const days: DaySchedule[] = []
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay())
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      day.setHours(0, 0, 0, 0)
      
      const daySlots = slots.filter(slot => {
        const slotDate = toLocalTime(slot.scheduled_at).date
        return slotDate.toDateString() === day.toDateString()
      })
      
      days.push({ date: day, slots: daySlots })
    }
    
    return days
  }, [slots, currentDate])

  const monthDays = useMemo(() => {
    const days: DaySchedule[] = []
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const day = new Date(year, month, d)
      day.setHours(0, 0, 0, 0)
      
      const daySlots = slots.filter(slot => {
        const slotDate = toLocalTime(slot.scheduled_at).date
        return slotDate.toDateString() === day.toDateString()
      })
      
      days.push({ date: day, slots: daySlots })
    }
    
    return days
  }, [slots, currentDate])

  const navigatePeriod = (direction: number) => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7))
    } else {
      newDate.setMonth(newDate.getMonth() + direction)
    }
    setCurrentDate(newDate)
  }

  const formatDateRange = (): string => {
    if (viewMode === 'week') {
      const start = new Date(currentDate)
      start.setDate(start.getDate() - start.getDay())
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      
      const startStr = start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      const endStr = end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      return `${startStr} - ${endStr}`
    } else {
      return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    }
  }

  const getSlotColor = (slot: Slot) => {
    if (slot.status === 'booked') return 'bg-green-100 border-green-300 text-green-800'
    if (slot.status === 'cancelled') return 'bg-red-100 border-red-300 text-red-800'
    if (slot.status === 'completed') return 'bg-gray-100 border-gray-300 text-gray-800'
    return 'bg-white border-gray-200 hover:border-blue-300'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      available: 'Disponível',
      booked: 'Agendado',
      cancelled: 'Cancelado',
      completed: 'Concluído'
    }
    return labels[status] || status
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agenda</h1>
        
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'week' 
                  ? 'bg-white shadow text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'month' 
                  ? 'bg-white shadow text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mês
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
        <button
          onClick={() => navigatePeriod(-1)}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-lg font-medium">{formatDateRange()}</div>
        
        <button
          onClick={() => navigatePeriod(1)}
          className="p-2 hover:bg-gray-100 rounded-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Carregando...</div>
      ) : viewMode === 'week' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
              <div key={i} className="px-2 py-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDays.map((day, i) => (
              <div key={i} className="border-r last:border-r-0">
                <div className={`px-2 py-2 text-center text-sm border-b ${
                  day.date.toDateString() === new Date().toDateString()
                    ? 'bg-blue-50 font-semibold text-blue-600'
                    : 'bg-gray-50'
                }`}>
                  <div className="text-xs text-gray-500">
                    {day.date.toLocaleDateString('pt-BR', { day: 'numeric' })}
                  </div>
                </div>
                
                <div className="p-2 space-y-2">
                  {day.slots.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center py-4">Sem horários</div>
                  ) : (
                    day.slots.map(slot => {
                      const { time } = toLocalTime(slot.scheduled_at)
                      return (
                        <button
                          key={slot.id}
                          onClick={() => {
                            setSelectedSlot(slot)
                            setShowModal(true)
                          }}
                          className={`w-full p-2 rounded-md border text-xs text-left ${getSlotColor(slot)}`}
                        >
                          <div className="font-medium">{time}</div>
                          {slot.patient && (
                            <div className="truncate opacity-75">{slot.patient.name}</div>
                          )}
                          <div className="text-[10px] opacity-60">{getStatusLabel(slot.status)}</div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-7 border-b">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
              <div key={i} className="px-2 py-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7">
            {Array.from({ length: monthDays[0]?.date.getDay() || 0 }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-b border-r bg-gray-50" />
            ))}
            
            {monthDays.map((day, i) => {
              const bookedCount = day.slots.filter(s => s.status === 'booked').length
              const availableCount = day.slots.filter(s => s.status === 'available').length
              
              return (
                <div 
                  key={i} 
                  className={`min-h-[100px] border-b border-r p-2 ${
                    day.date.toDateString() === new Date().toDateString()
                      ? 'bg-blue-50'
                      : ''
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    day.date.toDateString() === new Date().toDateString()
                      ? 'text-blue-600'
                      : 'text-gray-700'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  
                  {bookedCount > 0 && (
                    <div className="text-xs text-green-600 font-medium">{bookedCount} agendado(s)</div>
                  )}
                  {availableCount > 0 && (
                    <div className="text-xs text-gray-500">{availableCount} disponível(is)</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Detalhes do Horário</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Data e Hora</label>
                <p className="font-medium">
                  {toLocalTime(selectedSlot.scheduled_at).date.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })} às {toLocalTime(selectedSlot.scheduled_at).time}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <p className={`font-medium ${
                  selectedSlot.status === 'booked' ? 'text-green-600' :
                  selectedSlot.status === 'available' ? 'text-blue-600' :
                  'text-gray-600'
                }`}>
                  {getStatusLabel(selectedSlot.status)}
                </p>
              </div>
              
              {selectedSlot.patient && (
                <div>
                  <label className="text-sm text-gray-500">Paciente</label>
                  <p className="font-medium">{selectedSlot.patient.name}</p>
                  <p className="text-sm text-gray-500">{selectedSlot.patient.email}</p>
                </div>
              )}
              
              {selectedSlot.status === 'available' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Este horário está disponível para agendamento.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
