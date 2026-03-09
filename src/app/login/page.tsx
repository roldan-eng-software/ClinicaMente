'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })

    if (result?.error) {
      setError('E-mail ou senha inválidos. Tente novamente.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <>
      {message === 'check_email' && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm text-center">
          Conta criada! Em um sistema real, você verificaria seu e-mail. Faça login agora.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="seu@email.com"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <Link href="/esqueci-a-senha" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Esqueci a senha
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Não tem uma conta?{' '}
          <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
            Criar nova conta
          </Link>
        </p>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex text-gray-900 bg-gray-50 flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -ml-[40rem] w-[80rem] h-[40rem] bg-gradient-to-b from-blue-100 to-transparent opacity-50 blur-3xl rounded-full mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-0 right-1/2 -mr-[40rem] w-[80rem] h-[40rem] bg-gradient-to-t from-sky-100 to-transparent opacity-50 blur-3xl rounded-full mix-blend-multiply pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para Home
        </Link>
        
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          Entrar na ClínicaMente
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Acesse seu painel para gerenciar sua clínica.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-white/20">
          <Suspense fallback={
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
