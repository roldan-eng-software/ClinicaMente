'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePsychologist } from '../context'
import { 
  saveClinicSettings, 
  saveCollaborator, 
  deleteCollaborator, 
  saveRoom, 
  deleteRoom,
  saveClinicSettingsAdvanced 
} from '@/app/actions/settings'

interface Room {
  id: string
  name: string
  color: string
  appointment_type: string
  is_active: boolean
}

interface Collaborator {
  id: string
  full_name: string
  email: string
  phone: string | null
  crp: string | null
  specialty: string | null
  bio: string | null
  is_active: boolean
}

interface ClinicSettings {
  appointment_types: string[]
  default_appointment_type: string
  show_patient_phone: boolean
  show_patient_email: boolean
  require_patient_phone: boolean
  require_patient_email: boolean
  send_email_reminder: boolean
  reminder_hours_before: number
}

type TabType = 'clinic' | 'rooms' | 'collaborators' | 'display' | 'advanced'

const colorOptions = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarelo' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#06B6D4', label: 'Ciano' },
  { value: '#F97316', label: 'Laranja' },
]

export default function SettingsPage() {
  const psychologist = usePsychologist()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<TabType>('clinic')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [rooms, setRooms] = useState<Room[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null)

  const [clinicForm, setClinicForm] = useState({
    clinicName: '',
    clinicAddress: '',
    clinicPhone: '',
    clinicEmail: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    sessionDuration: '50',
    eventTypes: ['appointment', 'blocked_time'],
    eventOrder: ['time', 'patient', 'type'],
  })

  const [roomModal, setRoomModal] = useState<{ open: boolean; room?: Room }>({ open: false })
  const [roomForm, setRoomForm] = useState({
    name: '',
    color: '#3B82F6',
    appointmentType: 'presencial',
  })

  const [collaboratorModal, setCollaboratorModal] = useState<{ open: boolean; collaborator?: Collaborator }>({ open: false })
  const [collaboratorForm, setCollaboratorForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    crp: '',
    specialty: '',
    bio: '',
  })

  const [advancedForm, setAdvancedForm] = useState({
    appointmentTypes: ['presencial', 'online'],
    defaultAppointmentType: 'presencial',
    showPatientPhone: true,
    showPatientEmail: true,
    requirePatientPhone: true,
    requirePatientEmail: false,
    sendEmailReminder: true,
    reminderHoursBefore: '24',
  })

  async function loadData() {
    setLoading(true)
    
    const [psychologistData, roomsData, collaboratorsData, settingsData] = await Promise.all([
      supabase
        .from('psychologists')
        .select('*')
        .eq('id', psychologist.id)
        .single(),
      supabase
        .from('rooms')
        .select('*')
        .eq('psychologist_id', psychologist.id)
        .order('name'),
      supabase
        .from('collaborators')
        .select('*')
        .eq('psychologist_id', psychologist.id)
        .order('full_name'),
      supabase
        .from('clinic_settings')
        .select('*')
        .eq('psychologist_id', psychologist.id)
        .single(),
    ])

    if (psychologistData.data) {
      setClinicForm({
        clinicName: psychologistData.data.clinic_name || '',
        clinicAddress: psychologistData.data.clinic_address || '',
        clinicPhone: psychologistData.data.clinic_phone || '',
        clinicEmail: psychologistData.data.clinic_email || psychologistData.data.email || '',
        primaryColor: psychologistData.data.primary_color || '#3B82F6',
        secondaryColor: psychologistData.data.secondary_color || '#10B981',
        sessionDuration: String(psychologistData.data.session_duration_minutes || '50'),
        eventTypes: psychologistData.data.event_types_to_show || ['appointment', 'blocked_time'],
        eventOrder: psychologistData.data.event_card_order || ['time', 'patient', 'type'],
      })
    }

    setRooms(roomsData.data || [])
    setCollaborators(collaboratorsData.data || [])
    
    if (settingsData.data) {
      setClinicSettings(settingsData.data)
      setAdvancedForm({
        appointmentTypes: settingsData.data.appointment_types || ['presencial', 'online'],
        defaultAppointmentType: settingsData.data.default_appointment_type || 'presencial',
        showPatientPhone: settingsData.data.show_patient_phone ?? true,
        showPatientEmail: settingsData.data.show_patient_email ?? true,
        requirePatientPhone: settingsData.data.require_patient_phone ?? true,
        requirePatientEmail: settingsData.data.require_patient_email ?? false,
        sendEmailReminder: settingsData.data.send_email_reminder ?? true,
        reminderHoursBefore: String(settingsData.data.reminder_hours_before || '24'),
      })
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleSaveClinic() {
    setSaving(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('clinicName', clinicForm.clinicName)
    formData.append('clinicAddress', clinicForm.clinicAddress)
    formData.append('clinicPhone', clinicForm.clinicPhone)
    formData.append('clinicEmail', clinicForm.clinicEmail)
    formData.append('primaryColor', clinicForm.primaryColor)
    formData.append('secondaryColor', clinicForm.secondaryColor)
    formData.append('sessionDuration', clinicForm.sessionDuration)
    clinicForm.eventTypes.forEach(type => formData.append('eventTypes', type))
    clinicForm.eventOrder.forEach(order => formData.append('eventOrder', order))

    const result = await saveClinicSettings(formData)
    
    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
    }
    setSaving(false)
  }

  async function handleSaveRoom() {
    setSaving(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('name', roomForm.name)
    formData.append('color', roomForm.color)
    formData.append('appointmentType', roomForm.appointmentType)
    if (roomModal.room) {
      formData.append('roomId', roomModal.room.id)
    }

    const result = await saveRoom(formData)
    
    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Sala salva com sucesso!' })
      setRoomModal({ open: false })
      setRoomForm({ name: '', color: '#3B82F6', appointmentType: 'presencial' })
      const { data } = await supabase.from('rooms').select('*').eq('psychologist_id', psychologist.id).order('name')
      setRooms(data || [])
    }
    setSaving(false)
  }

  async function handleDeleteRoom(roomId: string) {
    if (!confirm('Tem certeza que deseja excluir esta sala?')) return
    
    const result = await deleteRoom(roomId)
    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      const { data } = await supabase.from('rooms').select('*').eq('psychologist_id', psychologist.id).order('name')
      setRooms(data || [])
    }
  }

  async function handleSaveCollaborator() {
    setSaving(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('fullName', collaboratorForm.fullName)
    formData.append('email', collaboratorForm.email)
    formData.append('phone', collaboratorForm.phone)
    formData.append('crp', collaboratorForm.crp)
    formData.append('specialty', collaboratorForm.specialty)
    formData.append('bio', collaboratorForm.bio)
    if (collaboratorModal.collaborator) {
      formData.append('collaboratorId', collaboratorModal.collaborator.id)
    }

    const result = await saveCollaborator(formData)
    
    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Colaborador salvo com sucesso!' })
      setCollaboratorModal({ open: false })
      setCollaboratorForm({ fullName: '', email: '', phone: '', crp: '', specialty: '', bio: '' })
      const { data } = await supabase.from('collaborators').select('*').eq('psychologist_id', psychologist.id).order('full_name')
      setCollaborators(data || [])
    }
    setSaving(false)
  }

  async function handleDeleteCollaborator(collaboratorId: string) {
    if (!confirm('Tem certeza que deseja excluir este colaborador?')) return
    
    const result = await deleteCollaborator(collaboratorId)
    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      const { data } = await supabase.from('collaborators').select('*').eq('psychologist_id', psychologist.id).order('full_name')
      setCollaborators(data || [])
    }
  }

  async function handleSaveAdvanced() {
    setSaving(true)
    setMessage(null)

    const formData = new FormData()
    advancedForm.appointmentTypes.forEach(type => formData.append('appointmentTypes', type))
    formData.append('defaultAppointmentType', advancedForm.defaultAppointmentType)
    formData.append('showPatientPhone', String(advancedForm.showPatientPhone))
    formData.append('showPatientEmail', String(advancedForm.showPatientEmail))
    formData.append('requirePatientPhone', String(advancedForm.requirePatientPhone))
    formData.append('requirePatientEmail', String(advancedForm.requirePatientEmail))
    formData.append('sendEmailReminder', String(advancedForm.sendEmailReminder))
    formData.append('reminderHoursBefore', advancedForm.reminderHoursBefore)

    const result = await saveClinicSettingsAdvanced(formData)
    
    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Configurações avançadas salvas com sucesso!' })
    }
    setSaving(false)
  }

  const tabs = [
    { id: 'clinic', label: 'Clínica', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10.5v.5a2 2 0 002 2h.5a2 2 0 002-2v-.5a2 2 0 00-2-2H9a2 2 0 00-2 2v.5' },
    { id: 'rooms', label: 'Salas', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'collaborators', label: 'Colaboradores', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'display', label: 'Visualização', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
    { id: 'advanced', label: 'Avançado', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ]

  const eventTypeOptions = [
    { value: 'appointment', label: 'Atendimentos' },
    { value: 'blocked_time', label: 'Horários bloqueados' },
    { value: 'unavailable', label: 'Indisponibilidades' },
  ]

  const eventOrderOptions = [
    { value: 'time', label: 'Horário' },
    { value: 'patient', label: 'Paciente' },
    { value: 'type', label: 'Tipo' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Configurações</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'clinic' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Informações da Clínica</h2>
                <p className="text-sm text-gray-500 mb-4">Dados básicos da sua clínica</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Clínica</label>
                    <input
                      type="text"
                      value={clinicForm.clinicName}
                      onChange={(e) => setClinicForm({ ...clinicForm, clinicName: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="Clinica Mente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="text"
                      value={clinicForm.clinicPhone}
                      onChange={(e) => setClinicForm({ ...clinicForm, clinicPhone: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <input
                      type="text"
                      value={clinicForm.clinicAddress}
                      onChange={(e) => setClinicForm({ ...clinicForm, clinicAddress: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="Rua Example, 123 - São Paulo, SP"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={clinicForm.clinicEmail}
                      onChange={(e) => setClinicForm({ ...clinicForm, clinicEmail: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="contato@clinica.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duração da Sessão (min)</label>
                    <select
                      value={clinicForm.sessionDuration}
                      onChange={(e) => setClinicForm({ ...clinicForm, sessionDuration: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="30">30 minutos</option>
                      <option value="45">45 minutos</option>
                      <option value="50">50 minutos</option>
                      <option value="60">60 minutos</option>
                      <option value="90">90 minutos</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h2 className="text-lg font-semibold mb-1">Cores da Interface</h2>
                <p className="text-sm text-gray-500 mb-4">Personalize as cores do sistema</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor Principal</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={clinicForm.primaryColor}
                        onChange={(e) => setClinicForm({ ...clinicForm, primaryColor: e.target.value })}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-500">{clinicForm.primaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor Secundária</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={clinicForm.secondaryColor}
                        onChange={(e) => setClinicForm({ ...clinicForm, secondaryColor: e.target.value })}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-500">{clinicForm.secondaryColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveClinic}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'rooms' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Salas</h2>
                  <p className="text-sm text-gray-500">Gerencie as salas de atendimento</p>
                </div>
                <button
                  onClick={() => setRoomModal({ open: true })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  + Nova Sala
                </button>
              </div>

              {rooms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma sala cadastrada
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room) => (
                    <div key={room.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-2" 
                            style={{ backgroundColor: room.color }}
                          />
                          <span className="font-medium">{room.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setRoomForm({
                                name: room.name,
                                color: room.color,
                                appointmentType: room.appointment_type,
                              })
                              setRoomModal({ open: true, room })
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="p-1 text-gray-500 hover:text-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 capitalize">{room.appointment_type}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'collaborators' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Colaboradores</h2>
                  <p className="text-sm text-gray-500">Cadastre outros profissionais</p>
                </div>
                <button
                  onClick={() => setCollaboratorModal({ open: true })}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  + Novo Colaborador
                </button>
              </div>

              {collaborators.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum colaborador cadastrado
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nome</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">CRP</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Especialidade</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collaborators.map((collaborator) => (
                        <tr key={collaborator.id} className="border-b">
                          <td className="py-3 px-4">{collaborator.full_name}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{collaborator.email}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{collaborator.crp || '-'}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">{collaborator.specialty || '-'}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setCollaboratorForm({
                                  fullName: collaborator.full_name,
                                  email: collaborator.email,
                                  phone: collaborator.phone || '',
                                  crp: collaborator.crp || '',
                                  specialty: collaborator.specialty || '',
                                  bio: collaborator.bio || '',
                                })
                                setCollaboratorModal({ open: true, collaborator })
                              }}
                              className="p-1 text-gray-500 hover:text-blue-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteCollaborator(collaborator.id)}
                              className="p-1 text-gray-500 hover:text-red-600 ml-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
          )}

          {activeTab === 'display' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Tipos de Eventos</h2>
                <p className="text-sm text-gray-500 mb-4">Escolha quais tipos de eventos deseja ver na agenda</p>
                
                <div className="space-y-2">
                  {eventTypeOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={clinicForm.eventTypes.includes(option.value)}
                        onChange={(e) => {
                          const newTypes = e.target.checked
                            ? [...clinicForm.eventTypes, option.value]
                            : clinicForm.eventTypes.filter(t => t !== option.value)
                          setClinicForm({ ...clinicForm, eventTypes: newTypes })
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <h2 className="text-lg font-semibold mb-1">Ordenação dos Cards</h2>
                <p className="text-sm text-gray-500 mb-4">Determine a ordem das informações nos cards de eventos</p>
                
                <div className="flex flex-wrap gap-2">
                  {eventOrderOptions.map((option, index) => (
                    <div key={option.value} className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
                      <span className="text-xs font-medium text-gray-500 mr-2">{index + 1}</span>
                      <select
                        value={clinicForm.eventOrder[index] || ''}
                        onChange={(e) => {
                          const newOrder = [...clinicForm.eventOrder]
                          newOrder[index] = e.target.value
                          setClinicForm({ ...clinicForm, eventOrder: newOrder })
                        }}
                        className="bg-transparent text-sm border-none focus:ring-0"
                      >
                        {eventOrderOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveClinic}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Tipos de Atendimento</h2>
                <p className="text-sm text-gray-500 mb-4">Configure os tipos de atendimento disponíveis</p>
                
                <div className="space-y-2 mb-4">
                  {['presencial', 'online'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={advancedForm.appointmentTypes.includes(type)}
                        onChange={(e) => {
                          const newTypes = e.target.checked
                            ? [...advancedForm.appointmentTypes, type]
                            : advancedForm.appointmentTypes.filter(t => t !== type)
                          setAdvancedForm({ ...advancedForm, appointmentTypes: newTypes })
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm capitalize">{type}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Padrão</label>
                  <select
                    value={advancedForm.defaultAppointmentType}
                    onChange={(e) => setAdvancedForm({ ...advancedForm, defaultAppointmentType: e.target.value })}
                    className="w-full max-w-xs border rounded-lg px-3 py-2 text-sm"
                  >
                    {advancedForm.appointmentTypes.map((type) => (
                      <option key={type} value={type} className="capitalize">{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h2 className="text-lg font-semibold mb-1">Campos do Paciente</h2>
                <p className="text-sm text-gray-500 mb-4">Configure quais campos exibir e obrigar no cadastro</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Exibir</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advancedForm.showPatientPhone}
                          onChange={(e) => setAdvancedForm({ ...advancedForm, showPatientPhone: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-sm">Telefone</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advancedForm.showPatientEmail}
                          onChange={(e) => setAdvancedForm({ ...advancedForm, showPatientEmail: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-sm">Email</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Obrigatório</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advancedForm.requirePatientPhone}
                          onChange={(e) => setAdvancedForm({ ...advancedForm, requirePatientPhone: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-sm">Telefone</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={advancedForm.requirePatientEmail}
                          onChange={(e) => setAdvancedForm({ ...advancedForm, requirePatientEmail: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="ml-2 text-sm">Email</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h2 className="text-lg font-semibold mb-1">Lembretes</h2>
                <p className="text-sm text-gray-500 mb-4">Configure o envio de lembretes</p>
                
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={advancedForm.sendEmailReminder}
                      onChange={(e) => setAdvancedForm({ ...advancedForm, sendEmailReminder: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="ml-2 text-sm">Enviar lembrete por email</span>
                  </label>
                  
                  {advancedForm.sendEmailReminder && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enviar lembrete</label>
                      <select
                        value={advancedForm.reminderHoursBefore}
                        onChange={(e) => setAdvancedForm({ ...advancedForm, reminderHoursBefore: e.target.value })}
                        className="w-full max-w-xs border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="12">12 horas antes</option>
                        <option value="24">24 horas antes</option>
                        <option value="48">48 horas antes</option>
                        <option value="72">72 horas antes</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveAdvanced}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {roomModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {roomModal.room ? 'Editar Sala' : 'Nova Sala'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Sala 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Atendimento</label>
                <select
                  value={roomForm.appointmentType}
                  onChange={(e) => setRoomForm({ ...roomForm, appointmentType: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="presencial">Presencial</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setRoomForm({ ...roomForm, color: color.value })}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        roomForm.color === color.value ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setRoomModal({ open: false })
                  setRoomForm({ name: '', color: '#3B82F6', appointmentType: 'presencial' })
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRoom}
                disabled={saving || !roomForm.name}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {collaboratorModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {collaboratorModal.collaborator ? 'Editar Colaborador' : 'Novo Colaborador'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={collaboratorForm.fullName}
                  onChange={(e) => setCollaboratorForm({ ...collaboratorForm, fullName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Dr. Nome Sobrenome"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={collaboratorForm.email}
                  onChange={(e) => setCollaboratorForm({ ...collaboratorForm, email: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={collaboratorForm.phone}
                  onChange={(e) => setCollaboratorForm({ ...collaboratorForm, phone: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CRP</label>
                <input
                  type="text"
                  value={collaboratorForm.crp}
                  onChange={(e) => setCollaboratorForm({ ...collaboratorForm, crp: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="XX/00000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
                <input
                  type="text"
                  value={collaboratorForm.specialty}
                  onChange={(e) => setCollaboratorForm({ ...collaboratorForm, specialty: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Psicologia Clínica"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={collaboratorForm.bio}
                  onChange={(e) => setCollaboratorForm({ ...collaboratorForm, bio: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Breve descrição..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setCollaboratorModal({ open: false })
                  setCollaboratorForm({ fullName: '', email: '', phone: '', crp: '', specialty: '', bio: '' })
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCollaborator}
                disabled={saving || !collaboratorForm.fullName || !collaboratorForm.email}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
