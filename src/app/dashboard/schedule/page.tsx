'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePsychologist } from '../context'

interface Room {
  id: string
  name: string
  color: string
  appointment_type: string
}

interface Slot {
  id: string
  scheduled_at: string
  status: string
  room_id?: string
  appointment_type?: string
  patient_id?: string
  patient?: {
    name: string
    email: string
  }
  room?: {
    name: string
    color: string
  }
}

interface DaySchedule {
  date: Date
  slots: Slot[]
}

interface Patient {
  id: string
  full_name: string
  email: string
  phone?: string
}

interface Collaborator {
  id: string
  full_name: string
  specialty: string
  crp?: string
}

const ROOM_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
]

const TABS = [
  { id: 'general', label: 'Agenda Geral' },
  { id: 'today', label: 'Hoje' },
  { id: 'room', label: 'Por Sala' },
]

export default function SchedulePage() {
  const psychologist = usePsychologist()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('general')
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [slots, setSlots] = useState<Slot[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string>('all')
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    roomId: '',
    appointmentType: 'presencial',
    collaboratorId: '',
    notes: '',
  })

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    return `${hour}:00`
  })

  useEffect(() => {
    loadData()
  }, [currentDate, viewMode])

  useEffect(() => {
    if (activeTab === 'room' && rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0].id)
    }
  }, [activeTab, rooms])

  async function loadData() {
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

    const [slotsData, roomsData, patientsData, collaboratorsData] = await Promise.all([
      supabase
        .from('slots')
        .select(`
          id,
          start_at,
          status,
          room_id,
          appointment_type,
          appointments!inner(id, patients:patients(full_name, email)),
          rooms:room_id(name, color)
        `)
        .eq('psychologist_id', psychologist.id)
        .gte('start_at', start.toISOString())
        .lte('start_at', end.toISOString())
        .order('start_at'),
      supabase
        .from('rooms')
        .select('*')
        .eq('psychologist_id', psychologist.id)
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('patients')
        .select('id, full_name, email, phone')
        .eq('psychologist_id', psychologist.id)
        .eq('is_active', true)
        .order('full_name'),
      supabase
        .from('collaborators')
        .select('id, full_name, specialty, crp')
        .eq('psychologist_id', psychologist.id)
        .eq('is_active', true)
        .order('full_name'),
    ])

    if (!slotsData.error && slotsData.data) {
      const formattedSlots = slotsData.data.map((slot: any) => ({
        ...slot,
        scheduled_at: slot.start_at,
        patient: slot.appointments?.[0]?.patients?.[0] || null,
        room: slot.rooms?.[0] || null
      }))
      setSlots(formattedSlots)
    }
    
    if (!roomsData.error && roomsData.data) {
      setRooms(roomsData.data)
    } else if (roomsData.error) {
      setRooms([
        { id: 'default', name: 'Sala 1', color: ROOM_COLORS[0], appointment_type: 'presencial' },
      ])
    }

    if (!patientsData.error && patientsData.data) {
      setPatients(patientsData.data)
    }

    if (!collaboratorsData.error && collaboratorsData.data) {
      setCollaborators(collaboratorsData.data)
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

  const filteredSlots = useMemo(() => {
    if (activeTab === 'room' && selectedRoom && selectedRoom !== 'all') {
      return slots.filter(s => s.room_id === selectedRoom)
    }
    return slots
  }, [slots, activeTab, selectedRoom])

  const todaySlots = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return slots.filter(slot => {
      const slotDate = toLocalTime(slot.scheduled_at).date
      return slotDate >= today && slotDate < tomorrow
    })
  }, [slots])

  const weekDays = useMemo(() => {
    const days: DaySchedule[] = []
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay())
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      day.setHours(0, 0, 0, 0)
      
      const daySlots = filteredSlots.filter(slot => {
        const slotDate = toLocalTime(slot.scheduled_at).date
        return slotDate.toDateString() === day.toDateString()
      })
      
      days.push({ date: day, slots: daySlots })
    }
    
    return days
  }, [filteredSlots, currentDate])

  const monthDays = useMemo(() => {
    const days: DaySchedule[] = []
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const day = new Date(year, month, d)
      day.setHours(0, 0, 0, 0)
      
      const daySlots = filteredSlots.filter(slot => {
        const slotDate = toLocalTime(slot.scheduled_at).date
        return slotDate.toDateString() === day.toDateString()
      })
      
      days.push({ date: day, slots: daySlots })
    }
    
    return days
  }, [filteredSlots, currentDate])

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
    
    if (slot.room?.color) {
      return `border-l-4`
    }
    return 'bg-white border-gray-200 hover:border-blue-300'
  }

  const getSlotBackground = (slot: Slot) => {
    if (slot.room?.color) {
      return { backgroundColor: slot.room.color + '20', borderLeftColor: slot.room.color }
    }
    return {}
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

  const getAppointmentTypeIcon = (type?: string) => {
    if (type === 'videoconferencia' || type === 'video') {
      return (
        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    }
    return (
      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }

  async function handleCreateAppointment() {
    setSaving(true)
    setMessage(null)

    if (!newAppointment.patientId || !newAppointment.date || !newAppointment.time) {
      setMessage({ type: 'error', text: 'Por favor, preencha todos os campos obrigatórios.' })
      setSaving(false)
      return
    }

    const formData = new FormData()
    formData.append('patientId', newAppointment.patientId)
    formData.append('date', newAppointment.date)
    formData.append('time', newAppointment.time)
    formData.append('roomId', newAppointment.roomId)
    formData.append('appointmentType', newAppointment.appointmentType)
    formData.append('collaboratorId', newAppointment.collaboratorId)
    formData.append('notes', newAppointment.notes)

    const { createManualAppointment, cancelAppointment } = await import('@/app/actions/appointments')
    const result = await createManualAppointment(formData)

    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Agendamento criado com sucesso!' })
      setShowNewAppointmentModal(false)
      setNewAppointment({
        patientId: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        roomId: '',
        appointmentType: 'presencial',
        collaboratorId: '',
        notes: '',
      })
      loadData()
    }
    setSaving(false)
  }

  const getTodayDate = () => {
    return new Date().toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long'
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b">
          <nav className="flex -mb-px overflow-x-auto" aria-label="Tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-0 whitespace-nowrap py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold">
          {activeTab === 'general' && 'Agenda Geral'}
          {activeTab === 'today' && 'Hoje'}
          {activeTab === 'room' && 'Agenda por Sala'}
        </h1>
        
        <div className="flex items-center gap-2 sm:space-x-4">
          {activeTab === 'room' && rooms.length > 0 && (
            <select
              value={selectedRoom || ''}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-sm"
            >
              <option value="all">Todas as salas</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowNewAppointmentModal(true)}
            className="flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo
          </button>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium ${
                viewMode === 'week' 
                  ? 'bg-white shadow text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium ${
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

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow p-2 sm:p-4">
        <button
          onClick={() => navigatePeriod(-1)}
          className="p-1 sm:p-2 hover:bg-gray-100 rounded-md"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-sm sm:text-lg font-medium">{formatDateRange()}</div>
        
        <button
          onClick={() => navigatePeriod(1)}
          className="p-1 sm:p-2 hover:bg-gray-100 rounded-md"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Legend for rooms */}
      {activeTab === 'general' && rooms.length > 0 && (
        <div className="flex flex-wrap gap-2 sm:gap-4 bg-white rounded-lg shadow p-3 sm:p-4">
          <span className="text-xs sm:text-sm text-gray-500">Salas:</span>
          {rooms.map((room) => (
            <div key={room.id} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-1 sm:mr-2" 
                style={{ backgroundColor: room.color }}
              />
              <span className="text-xs sm:text-sm">{room.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Today Tab Content */}
      {activeTab === 'today' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b">
            <h2 className="text-lg font-semibold capitalize">{getTodayDate()}</h2>
            <p className="text-sm text-gray-500">{todaySlots.length} agendamento(s)</p>
          </div>
          
          {loading ? (
            <div className="text-center py-8 sm:py-12">Carregando...</div>
          ) : todaySlots.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              Nenhum agendamento para hoje
            </div>
          ) : (
            <div className="divide-y">
              {todaySlots
                .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                .map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => {
                      setSelectedSlot(slot)
                      setShowModal(true)
                    }}
                    className="w-full p-3 sm:p-4 hover:bg-gray-50 text-left flex items-center gap-3 sm:gap-4"
                    style={getSlotBackground(slot)}
                  >
                    <div className="text-center flex-shrink-0">
                      <div className="text-lg sm:text-xl font-bold text-gray-900">
                        {toLocalTime(slot.scheduled_at).time}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        {slot.patient?.name || 'Paciente não definido'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {slot.room && (
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: slot.room.color + '30', color: slot.room.color }}
                          >
                            {slot.room.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 flex items-center">
                          {getAppointmentTypeIcon(slot.appointment_type)}
                          <span className="ml-1">
                            {slot.appointment_type === 'videoconferencia' || slot.appointment_type === 'video' 
                              ? 'Videoconferência' 
                              : 'Presencial'}
                          </span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        slot.status === 'booked' ? 'bg-green-100 text-green-800' :
                        slot.status === 'available' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusLabel(slot.status)}
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Week/Month View */}
      {(activeTab === 'general' || activeTab === 'room') && (
        <>
          {viewMode === 'week' ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="grid grid-cols-7 border-b">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => (
                  <div key={i} className="px-1 sm:px-2 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-500 bg-gray-50">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 min-h-[300px] sm:min-h-[400px]">
                {weekDays.map((day, i) => (
                  <div key={i} className="border-r last:border-r-0">
                    <div className={`px-1 sm:px-2 py-1 sm:py-2 text-center text-xs sm:text-sm border-b ${
                      day.date.toDateString() === new Date().toDateString()
                        ? 'bg-blue-50 font-semibold text-blue-600'
                        : 'bg-gray-50'
                    }`}>
                      <div className="text-xs text-gray-500">
                        {day.date.toLocaleDateString('pt-BR', { day: 'numeric' })}
                      </div>
                    </div>
                    
                    <div className="p-1 sm:p-2 space-y-1 sm:space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                      {day.slots.length === 0 ? (
                        <div className="text-xs text-gray-400 text-center py-2 sm:py-4">-</div>
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
                              className={`w-full p-1 sm:p-2 rounded-md border text-xs text-left ${getSlotColor(slot)}`}
                              style={getSlotBackground(slot)}
                            >
                              <div className="font-medium text-[10px] sm:text-xs">{time}</div>
                              {slot.patient && (
                                <div className="truncate opacity-75 text-[10px]">{slot.patient.name}</div>
                              )}
                              {activeTab === 'general' && slot.room && (
                                <div 
                                  className="text-[8px] mt-0.5"
                                  style={{ color: slot.room.color }}
                                >
                                  {slot.room.name}
                                </div>
                              )}
                              <div className="text-[8px] sm:text-[10px] opacity-60 hidden sm:block">
                                {slot.appointment_type === 'videoconferencia' || slot.appointment_type === 'video'
                                  ? '📹'
                                  : '📍'} {getStatusLabel(slot.status)}
                              </div>
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
                  <div key={i} className="px-1 sm:px-2 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-500 bg-gray-50">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7">
                {Array.from({ length: monthDays[0]?.date.getDay() || 0 }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[60px] sm:min-h-[100px] border-b border-r bg-gray-50" />
                ))}
                
                {monthDays.map((day, i) => {
                  const bookedCount = day.slots.filter(s => s.status === 'booked').length
                  const availableCount = day.slots.filter(s => s.status === 'available').length
                  
                  return (
                    <div 
                      key={i} 
                      className={`min-h-[60px] sm:min-h-[100px] border-b border-r p-1 sm:p-2 ${
                        day.date.toDateString() === new Date().toDateString()
                          ? 'bg-blue-50'
                          : ''
                      }`}
                    >
                      <div className={`text-xs sm:text-sm font-medium mb-0 sm:mb-1 ${
                        day.date.toDateString() === new Date().toDateString()
                          ? 'text-blue-600'
                          : 'text-gray-700'
                      }`}>
                        {day.date.getDate()}
                      </div>
                      
                      {bookedCount > 0 && (
                        <div className="text-[10px] sm:text-xs text-green-600 font-medium">{bookedCount} agendado(s)</div>
                      )}
                      {availableCount > 0 && (
                        <div className="text-[10px] sm:text-xs text-gray-500">{availableCount} disponível(is)</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Slot Detail Modal */}
      {showModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Detalhes do Horário</h3>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-sm text-gray-500">Data e Hora</label>
                <p className="font-medium text-sm sm:text-base">
                  {toLocalTime(selectedSlot.scheduled_at).date.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })} às {toLocalTime(selectedSlot.scheduled_at).time}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-gray-500">Tipo de Atendimento</label>
                <p className="font-medium text-sm sm:text-base flex items-center">
                  {getAppointmentTypeIcon(selectedSlot.appointment_type)}
                  <span className="ml-1">
                    {selectedSlot.appointment_type === 'videoconferencia' || selectedSlot.appointment_type === 'video' 
                      ? 'Videoconferência' 
                      : 'Presencial'}
                  </span>
                </p>
              </div>

              {selectedSlot.room && (
                <div>
                  <label className="text-sm text-gray-500">Sala</label>
                  <p className="font-medium text-sm sm:text-base flex items-center">
                    <span 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: selectedSlot.room.color }}
                    />
                    {selectedSlot.room.name}
                  </p>
                </div>
              )}
              
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <p className={`font-medium text-sm sm:text-base ${
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
                  <p className="font-medium text-sm sm:text-base">{selectedSlot.patient.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{selectedSlot.patient.email}</p>
                </div>
              )}
              
              {selectedSlot.status === 'available' && (
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Este horário está disponível para agendamento.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 sm:space-x-3 mt-4 sm:mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Appointment Modal */}
      {showNewAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Novo Agendamento</h3>

            {message && (
              <div className={`p-3 rounded-lg mb-4 text-sm ${
                message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paciente *
                </label>
                <select
                  value={newAppointment.patientId}
                  onChange={(e) => setNewAppointment({ ...newAppointment, patientId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Selecione um paciente</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora *
                  </label>
                  <select
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sala
                </label>
                <select
                  value={newAppointment.roomId}
                  onChange={(e) => setNewAppointment({ ...newAppointment, roomId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Selecione uma sala</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Atendimento
                </label>
                <select
                  value={newAppointment.appointmentType}
                  onChange={(e) => setNewAppointment({ ...newAppointment, appointmentType: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="presencial">Presencial</option>
                  <option value="videoconferencia">Videoconferência</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Colaborador
                </label>
                <select
                  value={newAppointment.collaboratorId}
                  onChange={(e) => setNewAppointment({ ...newAppointment, collaboratorId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Selecione um colaborador</option>
                  {collaborators.map((collab) => (
                    <option key={collab.id} value={collab.id}>{collab.full_name} - {collab.specialty}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNewAppointmentModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAppointment}
                disabled={saving || !newAppointment.patientId || !newAppointment.date || !newAppointment.time}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Criar Agendamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
