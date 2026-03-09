import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const psychologist = await prisma.psychologist.findUnique({
    where: { userId: session.user.id },
    select: { id: true, fullName: true },
  })

  if (!psychologist) {
    return NextResponse.json({ error: 'Psychologist not found' }, { status: 404 })
  }

  const now = new Date()
  const futureDate = new Date()
  futureDate.setMonth(futureDate.getMonth() + 3)

  const appointments = await prisma.appointment.findMany({
    where: {
      psychologistId: psychologist.id,
      status: { in: ['scheduled', 'confirmed'] },
      dateTime: { gte: now, lte: futureDate },
    },
    include: {
      patient: { select: { fullName: true, email: true } },
      room: { select: { id: true, name: true } },
    },
    orderBy: { dateTime: 'asc' },
  })

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
X-WR-CALNAME:ClínicaMente - ${escapeText(psychologist.fullName)}
X-WR-TIMEZONE:America/Sao_Paulo
`

  appointments.forEach((apt) => {
    const startDate = apt.dateTime
    const endDate = apt.endTime || new Date(startDate.getTime() + 50 * 60000)

    const patientName = apt.patient?.fullName || 'Paciente'
    const patientEmail = apt.patient?.email || ''
    const roomName = apt.room?.name || null

    const summary = apt.type === 'videoconferencia'
      ? `📹 Consulta vídeo - ${patientName}`
      : `🏥 Consulta presencial - ${patientName}`

    const description = roomName
      ? `Paciente: ${patientName}\\nEmail: ${patientEmail}\\nSala: ${roomName}\\nTipo: ${apt.type === 'videoconferencia' ? 'Videoconferência' : 'Presencial'}`
      : `Paciente: ${patientName}\\nEmail: ${patientEmail}\\nTipo: ${apt.type === 'videoconferencia' ? 'Videoconferência' : 'Presencial'}`

    ical += `BEGIN:VEVENT
UID:${apt.id}@clinicamente.com.br
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
      'Content-Disposition': `attachment; filename="agenda-${psychologist.fullName.toLowerCase().replace(/\s+/g, '-')}.ics"`,
    },
  })
}
