'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePsychologist } from '@/app/dashboard/context'

interface Task {
  id: string
  title: string
  description?: string
  due_date?: string
  priority: 'low' | 'medium' | 'high'
  completed: boolean
  created_at: string
}

export function TasksWidget() {
  const psychologist = usePsychologist()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as const
  })

  useEffect(() => {
    loadTasks()
  }, [psychologist.id])

  async function loadTasks() {
    setLoading(true)
    
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('psychologist_id', psychologist.id)
      .eq('completed', false)
      .order('due_date', { ascending: true })
      .order('priority', { ascending: false })

    if (data) {
      setTasks(data)
    }
    
    setLoading(false)
  }

  async function addTask() {
    if (!newTask.title.trim()) return

    const { error } = await supabase
      .from('tasks')
      .insert({
        psychologist_id: psychologist.id,
        title: newTask.title,
        description: newTask.description || null,
        due_date: newTask.due_date || null,
        priority: newTask.priority,
        completed: false
      })

    if (!error) {
      setNewTask({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium'
      })
      setShowNewTask(false)
      loadTasks()
    }
  }

  async function toggleTask(taskId: string, completed: boolean) {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !completed })
      .eq('id', taskId)

    if (!error) {
      loadTasks()
    }
  }

  async function deleteTask(taskId: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (!error) {
      loadTasks()
    }
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa'
    }
    return labels[priority] || priority
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoje'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Amanhã'
    }
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    })
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && formatDate(dueDate) !== 'Hoje'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Tarefas</h2>
        <div className="text-center py-8 text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tarefas</h2>
          <button
            onClick={() => setShowNewTask(!showNewTask)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showNewTask ? 'Cancelar' : '+ Nova'}
          </button>
        </div>

        {showNewTask && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <input
              type="text"
              placeholder="Título da tarefa"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Descrição (opcional)"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Baixa prioridade</option>
                <option value="medium">Média prioridade</option>
                <option value="high">Alta prioridade</option>
              </select>
            </div>
            <button
              onClick={addTask}
              disabled={!newTask.title.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Criar Tarefa
            </button>
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Nenhuma tarefa pendente
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  isOverdue(task.due_date) ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id, task.completed)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                    {isOverdue(task.due_date) && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Vencida
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-sm mt-1 break-words">{task.title}</div>
                  {task.description && (
                    <div className="text-xs text-gray-600 mt-1 break-words">{task.description}</div>
                  )}
                  {task.due_date && (
                    <div className="text-xs text-gray-500 mt-2">
                      Vence: {formatDate(task.due_date)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
