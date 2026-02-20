'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePsychologist } from '../context'

interface AvailabilityRule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

interface AvailabilityBlock {
  id: string
  start_datetime: string
  end_datetime: string
  reason: string
}

const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default function AvailabilityPage() {
  const psychologist = usePsychologist()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rules, setRules] = useState<AvailabilityRule[]>([])
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([])
  
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockForm, setBlockForm] = useState({
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '12:00',
    reason: '',
  })

  const defaultRule = {
    day_of_week: 1,
    start_time: '09:00',
    end_time: '12:00',
    is_active: false,
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    
    const [rulesData, blocksData] = await Promise.all([
      supabase
        .from('availability_rules')
        .select('*')
        .eq('psychologist_id', psychologist.id)
        .order('day_of_week'),
      supabase
        .from('availability_blocks')
        .select('*')
        .eq('psychologist_id', psychologist.id)
        .gte('end_datetime', new Date().toISOString())
        .order('start_datetime')
    ])

    const rulesWithDefault = [0, 1, 2, 3, 4, 5, 6].map(day => {
      const existing = rulesData.data?.find(r => r.day_of_week === day)
      return existing || { ...defaultRule, day_of_week: day }
    })

    setRules(rulesWithDefault)
    setBlocks(blocksData.data || [])
    setLoading(false)
  }

  async function saveRules() {
    setSaving(true)

    const activeRules = rules.filter(r => r.is_active)
    
    for (const rule of activeRules) {
      const [startHour] = rule.start_time.split(':').map(Number)
      const [endHour] = rule.end_time.split(':').map(Number)
      
      if (startHour >= endHour) {
        alert(`Horário final deve ser maior que inicial para ${dayNames[rule.day_of_week]}`)
        setSaving(false)
        return
      }
    }

    const { error: deleteError } = await supabase
      .from('availability_rules')
      .delete()
      .eq('psychologist_id', psychologist.id)

    if (deleteError) {
      console.error('Erro ao deletar regras:', deleteError)
      alert('Erro ao salvar disponibilidade. Tente novamente.')
      setSaving(false)
      return
    }

    if (activeRules.length > 0) {
      const { error: insertError } = await supabase
        .from('availability_rules')
        .insert(activeRules.map(r => ({
          psychologist_id: psychologist.id,
          day_of_week: r.day_of_week,
          start_time: r.start_time,
          end_time: r.end_time,
          is_active: r.is_active,
        })))

      if (insertError) {
        console.error('Erro ao inserir regras:', insertError)
        alert('Erro ao salvar disponibilidade. Tente novamente.')
        setSaving(false)
        return
      }
    }

    await regenerateSlots()

    setSaving(false)
    alert('Disponibilidade salva com sucesso!')
  }

  async function regenerateSlots() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + 60)

    const { data: existingSlots, error: fetchError } = await supabase
      .from('slots')
      .select('id, start_at, status')
      .eq('psychologist_id', psychologist.id)
      .gte('start_at', today.toISOString())
      .eq('status', 'available')

    if (fetchError) {
      console.error('Erro ao buscar slots existentes:', fetchError)
      return
    }

    const slotsToDelete = existingSlots?.map(s => s.id) || []

    if (slotsToDelete.length > 0) {
      await supabase
        .from('slots')
        .delete()
        .in('id', slotsToDelete)
    }

    const { data: activeRules, error: rulesError } = await supabase
      .from('availability_rules')
      .select('*')
      .eq('psychologist_id', psychologist.id)
      .eq('is_active', true)

    if (rulesError) {
      console.error('Erro ao buscar regras ativas:', rulesError)
      return
    }

    const { data: psychologistData } = await supabase
      .from('psychologists')
      .select('session_duration_minutes')
      .eq('id', psychologist.id)
      .single()

    const sessionDuration = psychologistData?.session_duration_minutes || 50

    const newSlots: { start_at: Date; end_at: Date; psychologist_id: string; status: string }[] = []

    for (const rule of activeRules || []) {
      const [startHour, startMin] = rule.start_time.split(':').map(Number)
      const [endHour, endMin] = rule.end_time.split(':').map(Number)
      
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      
      let currentDate = new Date(today)
      
      while (currentDate <= futureDate) {
        if (currentDate.getDay() === rule.day_of_week) {
          let slotStartMinutes = startMinutes
          
          while (slotStartMinutes + sessionDuration <= endMinutes) {
            const slotDate = new Date(currentDate)
            slotDate.setHours(Math.floor(slotStartMinutes / 60), slotStartMinutes % 60, 0, 0)
            
            const slotEndDate = new Date(slotDate)
            slotEndDate.setMinutes(slotEndDate.getMinutes() + sessionDuration)
            
            newSlots.push({
              start_at: slotDate,
              end_at: slotEndDate,
              psychologist_id: psychologist.id,
              status: 'available',
            })
            
            slotStartMinutes += sessionDuration
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    if (newSlots.length > 0) {
      await supabase
        .from('slots')
        .insert(newSlots)
    }
  }

  async function saveBlock() {
    if (!blockForm.startDate || !blockForm.endDate) {
      alert('Selecione as datas de início e fim')
      return
    }

    const start = new Date(`${blockForm.startDate}T${blockForm.startTime}:00`)
    const end = new Date(`${blockForm.endDate}T${blockForm.endTime}:00`)

    if (start >= end) {
      alert('Data final deve ser maior que inicial')
      return
    }

    setSaving(true)

    await supabase
      .from('availability_blocks')
      .insert({
        psychologist_id: psychologist.id,
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
        reason: blockForm.reason || null,
      })

    await cancelBlockedSlots(start, end)

    setShowBlockModal(false)
    setBlockForm({
      startDate: '',
      startTime: '09:00',
      endDate: '',
      endTime: '12:00',
      reason: '',
    })

    await loadData()
    setSaving(false)
  }

  async function cancelBlockedSlots(start: Date, end: Date) {
    const { data: slotsToCancel } = await supabase
      .from('slots')
      .select('id')
      .eq('psychologist_id', psychologist.id)
      .eq('status', 'available')
      .gte('start_at', start.toISOString())
      .lt('start_at', end.toISOString())

    if (slotsToCancel && slotsToCancel.length > 0) {
      await supabase
        .from('slots')
        .delete()
        .in('id', slotsToCancel.map(s => s.id))
    }
  }

  async function deleteBlock(id: string) {
    if (!confirm('Tem certeza que deseja excluir este bloqueio?')) return

    setSaving(true)
    await supabase
      .from('availability_blocks')
      .delete()
      .eq('id', id)

    await loadData()
    setSaving(false)
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0')
    return `${hour}:00`
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Disponibilidade</h1>
        
        <button
          onClick={() => setShowBlockModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Adicionar Bloqueio
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Horário Semanal</h2>
          <p className="text-sm text-gray-500">Configure seus horários de atendimento para cada dia da semana</p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.day_of_week}
                className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                  rule.is_active ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rule.is_active}
                    onChange={(e) => {
                      const newRules = [...rules]
                      newRules[rule.day_of_week] = { ...rule, is_active: e.target.checked }
                      setRules(newRules)
                    }}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className={`ml-3 font-medium ${rule.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                    {dayNames[rule.day_of_week]}
                  </span>
                </div>

                {rule.is_active && (
                  <div className="flex items-center space-x-2">
                    <select
                      value={rule.start_time}
                      onChange={(e) => {
                        const newRules = [...rules]
                        newRules[rule.day_of_week] = { ...rule, start_time: e.target.value }
                        setRules(newRules)
                      }}
                      className="border rounded-lg px-3 py-2 text-sm"
                    >
                      {timeOptions.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                    <span className="text-gray-400">às</span>
                    <select
                      value={rule.end_time}
                      onChange={(e) => {
                        const newRules = [...rules]
                        newRules[rule.day_of_week] = { ...rule, end_time: e.target.value }
                        setRules(newRules)
                      }}
                      className="border rounded-lg px-3 py-2 text-sm"
                    >
                      {timeOptions.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveRules}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Disponibilidade'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Bloqueios</h2>
          <p className="text-sm text-gray-500">Períodos específicos em que você não atenderá</p>
        </div>

        {blocks.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Nenhum bloqueio cadastrado
          </div>
        ) : (
          <div className="divide-y">
            {blocks.map((block) => (
              <div key={block.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {formatDateTime(block.start_datetime)} - {formatDateTime(block.end_datetime)}
                  </div>
                  {block.reason && (
                    <div className="text-sm text-gray-500">{block.reason}</div>
                  )}
                </div>
                <button
                  onClick={() => deleteBlock(block.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Adicionar Bloqueio</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Data início</label>
                  <input
                    type="date"
                    value={blockForm.startDate}
                    onChange={(e) => setBlockForm({ ...blockForm, startDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Hora início</label>
                  <select
                    value={blockForm.startTime}
                    onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Data fim</label>
                  <input
                    type="date"
                    value={blockForm.endDate}
                    onChange={(e) => setBlockForm({ ...blockForm, endDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Hora fim</label>
                  <select
                    value={blockForm.endTime}
                    onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">Motivo (opcional)</label>
                <input
                  type="text"
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                  placeholder="Férias, curso, doença..."
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveBlock}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Adicionar Bloqueio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
