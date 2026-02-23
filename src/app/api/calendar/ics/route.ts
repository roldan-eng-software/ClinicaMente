import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: psychologist } = await supabase
    .from('psychologists')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!psychologist) {
    return NextResponse.json({ error: 'Psychologist not found' }, { status: 404 })
  }

  const now = new Date()
  const futureDate = new Date()
  futureDate.setMonth(futureDate.getMonth() + 3)

  const { data: slots } = await supabase
    .from('slots')
    .select(`
      id,
      scheduled_at,
      status,
      duration_minutes,
      room_id,
      appointment_type,
      patients:patient_id(name, email)
    `)
    .eq('psychologist_id', psychologist.id)
    .eq('status', 'booked')
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', futureDate.toISOString())
    .order('scheduled_at')

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, name')
    .eq('psychologist_id', psychologist.id)

  const roomMap = new Map(rooms?.map(r => [r.id, r.name]) || [])

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const escapeText = (text: string) => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
  }

  let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ClinicaMente//Agenda//PT-BR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:ClínicaMente - ${escapeText(psychologist.full_name)}
X-WR-TIMEZONE:America/Sao_Paulo
`

  slots?.forEach((slot: any) => {
    const startDate = new Date(slot.scheduled_at)
    const endDate = new Date(startDate)
    endDate.setMinutes(endDate.getMinutes() + (slot.duration_minutes || 50))
    
    const roomName = slot.room_id ? roomMap.get(slot.room_id) : null
    const patientName = slot.patients?.[0]?.name || 'Paciente'
    const patientEmail = slot.patients?.[0]?.email || ''
    
    const summary = slot.appointment_type === 'videoconferencia' || slot.appointment_type === 'video'
      ? `📹 Consulta vídeo - ${patientName}`
      : `🏥 Consulta presencial - ${patientName}`
    
    const description = roomName 
      ? `Paciente: ${patientName}\\nEmail: ${patientEmail}\\nSala: ${roomName}\\nTipo: ${slot.appointment_type === 'videoconferencia' ? 'Videoconferência' : 'Presencial'}`
      : `Paciente: ${patientName}\\nEmail: ${patientEmail}\\nTipo: ${slot.appointment_type === 'videoconferencia' ? 'Videoconferência' : 'Presencial'}`

    ical += `BEGIN:VEVENT
UID:${slot.id}@clinicamente.com.br
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${escapeText(summary)}
DESCRIPTION:${escapeText(description)}
STATUS:CONFIRMED
END:VEVENT
`
  })

  ical += `END:VCALENDAR`

  return new NextResponse(ical, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="agenda-${psychologist.full_name.toLowerCase().replace(/\s+/g, '-')}.ics"`,
    },
  })
}
