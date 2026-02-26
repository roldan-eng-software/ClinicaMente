'use client'

import { useMemo } from 'react'

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
  collaborator_id?: string
  patient?: {
    name: string
    email: string
  }
  room?: {
    name: string
    color: string
  }
  collaborator?: {
    id: string
    full_name: string
    specialty: string
  }
}

interface RoomScheduleViewProps {
  currentDate: Date
  slots: Slot[]
  rooms: Room[]
  statusFilter: string
  loading: boolean
  onDateSelect: (date: Date) => void
  onSlotClick: (slot: Slot) => void
  toLocalTime: (utcDateStr: string) => { date: Date; time: string }
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'booked':
      return 'bg-green-100 text-green-800 border border-green-300'
    case 'available':
      return 'bg-blue-100 text-blue-800 border border-blue-300'
    case 'completed':
      return 'bg-gray-100 text-gray-800 border border-gray-300'
    case 'cancelled':
      return 'bg-red-100 text-red-800 border border-red-300'
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-300'
  }
}

function CalendarPanel({ 
  currentDate, 
  onDateSelect 
}: { 
  currentDate: Date
  onDateSelect: (date: Date) => void 
}) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  const handlePrevMonth = () => {
    onDateSelect(new Date(year, month - 1, 1))
  }
  
  const handleNextMonth = () => {
    onDateSelect(new Date(year, month + 1, 1))
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 h-fit sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Calendário</h3>
      </div>
      
      {/* Month/Year Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          title="Mês anterior"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <span className="font-medium text-sm text-gray-900">
          {new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
        
        <button
          onClick={handleNextMonth}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          title="Próximo mês"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const date = new Date(year, month, day)
          const isToday = date.toDateString() === new Date().toDateString()
          const isSelected = date.toDateString() === currentDate.toDateString()
          
          return (
            <button
              key={day}
              onClick={() => onDateSelect(date)}
              className={`aspect-square text-xs font-medium rounded transition-colors flex items-center justify-center ${
                isSelected
                  ? 'bg-blue-500 text-white'
                  : isToday
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-4 pt-4 border-t space-y-2 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
          <span>Hoje</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Selecionado</span>
        </div>
      </div>
    </div>
  )
}

function EventsTable({ 
  slots, 
  currentDate,
  statusFilter,
  onSlotClick,
  toLocalTime,
  loading 
}: {
  slots: Slot[]
  currentDate: Date
  statusFilter: string
  onSlotClick: (slot: Slot) => void
  toLocalTime: (utcDateStr: string) => { date: Date; time: string }
  loading: boolean
}) {
  // Filter slots for the selected date
  const filteredSlots = useMemo(() => {
    let filtered = slots.filter(slot => {
      const slotDate = toLocalTime(slot.scheduled_at).date
      return slotDate.toDateString() === currentDate.toDateString()
    })
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter)
    }
    
    return filtered.sort((a, b) => 
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    )
  }, [slots, currentDate, statusFilter, toLocalTime])
  
  const dateStr = currentDate.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  })

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-fit">
      {/* Header */}
      <div className="border-b p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Eventos do dia {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
          </h2>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Atualizar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>
      
      {/* Table */}
      {loading ? (
        <div className="p-6 text-center text-gray-500">Carregando...</div>
      ) : filteredSlots.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          Nenhum evento para este dia
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Sala</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Evento</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Hora</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700 hidden lg:table-cell">Colaborador</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredSlots.map((slot) => (
                <tr 
                  key={slot.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onSlotClick(slot)}
                >
                  {/* Sala */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {slot.room && (
                        <>
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: slot.room.color }}
                          />
                          <span className="font-medium text-gray-900">{slot.room.name}</span>
                        </>
                      )}
                      {!slot.room && <span className="text-gray-500">-</span>}
                    </div>
                  </td>
                  
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(slot.status)}`}>
                      {getStatusLabel(slot.status)}
                    </span>
                  </td>
                  
                  {/* Evento */}
                  <td className="px-4 py-3">
                    <span className="text-gray-900 font-medium truncate block max-w-xs">
                      {slot.patient?.name || 'Paciente não definido'}
                    </span>
                    {slot.patient?.email && (
                      <span className="text-xs text-gray-500 truncate block">
                        {slot.patient.email}
                      </span>
                    )}
                  </td>
                  
                  {/* Hora */}
                  <td className="px-4 py-3">
                    <span className="text-gray-900 font-medium">
                      {toLocalTime(slot.scheduled_at).time}
                    </span>
                  </td>
                  
                  {/* Colaborador (hidden on mobile) */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-gray-700">
                      {slot.collaborator?.full_name || '-'}
                    </span>
                  </td>
                  
                  {/* Ações */}
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Menu dropdown pode ser implementado aqui
                      }}
                      className="inline-flex items-center justify-center p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                      title="Mais ações"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RoomGrid({ 
  slots,
  rooms,
  currentDate,
  toLocalTime 
}: {
  slots: Slot[]
  rooms: Room[]
  currentDate: Date
  toLocalTime: (utcDateStr: string) => { date: Date; time: string }
}) {
  const daySlots = useMemo(() => {
    return slots.filter(slot => {
      const slotDate = toLocalTime(slot.scheduled_at).date
      return slotDate.toDateString() === currentDate.toDateString()
    })
  }, [slots, currentDate, toLocalTime])

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade de Salas</h3>
      
      <div className="overflow-x-auto">
        <div className="grid gap-4 min-w-fit" style={{ gridTemplateColumns: `repeat(${Math.max(rooms.length, 3)}, minmax(150px, 1fr))` }}>
          {rooms.map((room) => {
            const roomSlots = daySlots.filter(s => s.room_id === room.id)
            
            return (
              <div 
                key={room.id}
                className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                style={{ borderColor: room.color + '40', backgroundColor: room.color + '08' }}
              >
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">{room.name}</h4>
                
                {roomSlots.length === 0 ? (
                  <div className="text-xs text-gray-500 text-center py-4">Sem eventos</div>
                ) : (
                  <div className="space-y-2">
                    {roomSlots.map((slot) => (
                      <div 
                        key={slot.id}
                        className="text-xs p-2 rounded border-l-4 bg-white"
                        style={{ borderLeftColor: room.color }}
                      >
                        <div className="font-medium text-gray-900 truncate">
                          {slot.patient?.name || 'Evento'}
                        </div>
                        <div className="text-gray-600">
                          {toLocalTime(slot.scheduled_at).time}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function RoomScheduleView({
  currentDate,
  slots,
  rooms,
  statusFilter,
  loading,
  onDateSelect,
  onSlotClick,
  toLocalTime
}: RoomScheduleViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Panel - Calendar (sticky on desktop) */}
      <div className="lg:col-span-1">
        <CalendarPanel 
          currentDate={currentDate}
          onDateSelect={onDateSelect}
        />
      </div>
      
      {/* Right Panel - Events and Grid */}
      <div className="lg:col-span-3 space-y-6">
        <EventsTable
          slots={slots}
          currentDate={currentDate}
          statusFilter={statusFilter}
          onSlotClick={onSlotClick}
          toLocalTime={toLocalTime}
          loading={loading}
        />
        
        <RoomGrid
          slots={slots}
          rooms={rooms}
          currentDate={currentDate}
          toLocalTime={toLocalTime}
        />
      </div>
    </div>
  )
}
