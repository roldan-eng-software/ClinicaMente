'use client'

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

interface AppointmentCardProps {
  slot: Slot
  view: 'day' | 'week' | 'month'
  onClick: () => void
  toLocalTime: (utcDateStr: string) => { date: Date; time: string }
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'booked':
      return 'bg-green-100 text-green-700 border border-green-300'
    case 'available':
      return 'bg-blue-100 text-blue-700 border border-blue-300'
    case 'completed':
      return 'bg-gray-100 text-gray-700 border border-gray-300'
    case 'cancelled':
      return 'bg-red-100 text-red-700 border border-red-300'
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-300'
  }
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
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )
  }
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

export function AppointmentCard({ slot, view, onClick, toLocalTime }: AppointmentCardProps) {
  const { time } = toLocalTime(slot.scheduled_at)
  const appointmentType = slot.appointment_type === 'videoconferencia' || slot.appointment_type === 'video' 
    ? 'Videoconferência' 
    : 'Presencial'

  const backgroundColor = slot.room?.color ? slot.room.color + '15' : 'transparent'
  const borderColor = slot.room?.color ? slot.room.color : '#e5e7eb'

  if (view === 'day') {
    return (
      <button
        onClick={onClick}
        className="w-full h-full p-2 rounded-lg border text-left text-xs flex flex-col justify-between group hover:shadow-lg transition-all duration-200"
        style={{
          backgroundColor,
          borderColor,
          borderWidth: '1px',
          borderLeftWidth: slot.room?.color ? '4px' : '1px'
        }}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="font-semibold text-xs text-gray-900 flex-shrink-0">{time}</div>
          {slot.room && (
            <div
              className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
              style={{ backgroundColor: slot.room.color }}
              title={slot.room.name}
            />
          )}
        </div>
        
        {slot.patient && (
          <div className="truncate opacity-90 text-xs font-medium mt-1 text-gray-800">{slot.patient.name}</div>
        )}

        <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
          {getAppointmentTypeIcon(slot.appointment_type)}
          <span className="hidden sm:inline">{appointmentType}</span>
        </div>

        {slot.collaborator && (
          <div className="text-xs opacity-60 truncate mt-0.5 text-gray-700 hidden sm:block">{slot.collaborator.full_name}</div>
        )}

        <div className="mt-1 flex-shrink-0">
          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(slot.status)}`}>
            {getStatusLabel(slot.status)}
          </span>
        </div>
      </button>
    )
  }

  if (view === 'week') {
    return (
      <button
        onClick={onClick}
        className="w-full p-2 rounded-md border text-xs text-left transition-all duration-200 hover:shadow-lg group"
        style={{
          backgroundColor,
          borderColor,
          borderLeftWidth: slot.room?.color ? '3px' : '1px'
        }}
      >
        <div className="font-semibold text-xs text-gray-900">{time}</div>
        
        {slot.patient && (
          <div className="truncate opacity-85 text-xs mt-1 text-gray-800">{slot.patient.name}</div>
        )}

        {slot.room && (
          <div
            className="text-xs mt-1 font-medium"
            style={{ color: slot.room.color }}
          >
            {slot.room.name}
          </div>
        )}

        <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
          {getAppointmentTypeIcon(slot.appointment_type)}
          <span>{getStatusLabel(slot.status)}</span>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-xs space-y-1 p-1 rounded-md border border-transparent hover:border-gray-300 transition-colors text-left"
      style={{ backgroundColor }}
    >
      <div className="font-semibold text-xs text-gray-900">{time}</div>
      {slot.patient && (
        <div className="text-xs truncate opacity-85 text-gray-800">{slot.patient.name}</div>
      )}
      <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(slot.status)}`}>
        {getStatusLabel(slot.status)}
      </div>
    </button>
  )
}
