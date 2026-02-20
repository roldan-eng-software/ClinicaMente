'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [slug, setSlug] = useState('')
  const [fullName, setFullName] = useState('')
  const [crp, setCrp] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: psychologist } = await supabase
        .from('psychologists')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (psychologist?.onboarding_completed) {
        router.push('/dashboard')
        return
      }

      if (psychologist) {
        setFullName(psychologist.full_name || '')
        setCrp(psychologist.crp || '')
        setSpecialty(psychologist.specialty || '')
        setBio(psychologist.bio || '')
      }

      setLoading(false)
    }

    checkUser()
  }, [supabase, router])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const generatedSlug = slug || generateSlug(fullName)

    const { data: existing } = await supabase
      .from('psychologists')
      .select('id')
      .eq('slug', generatedSlug)
      .neq('user_id', user.id)
      .single()

    if (existing) {
      setError('Este URL já está em uso. Escolha outro.')
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase
      .from('psychologists')
      .update({
        full_name: fullName,
        slug: generatedSlug,
        crp,
        specialty,
        bio,
        onboarding_completed: true,
      })
      .eq('user_id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Bem-vindo ao ClínicaMente!</h1>
          <p className="text-center text-gray-600 mb-8">
            Complete seu perfil para começar a usar a plataforma.
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nome completo *
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  if (!slug) {
                    setSlug(generateSlug(e.target.value))
                  }
                }}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                URL do seu perfil público
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  clinicamente.app/p/
                </span>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="seu-nome"
                />
              </div>
            </div>

            <div>
              <label htmlFor="crp" className="block text-sm font-medium text-gray-700">
                CRP *
              </label>
              <input
                id="crp"
                type="text"
                value={crp}
                onChange={(e) => setCrp(e.target.value)}
                required
                placeholder="06/123456"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
                Especialidade
              </label>
              <input
                id="specialty"
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Psicologia Clínica, Terapia Cognitivo-Comportamental..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio (para página pública)
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Conte um pouco sobre sua experiência e abordagem..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Completar cadastro'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
