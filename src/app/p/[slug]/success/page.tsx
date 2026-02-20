'use client'

import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function SuccessPage({ params }: { params: Promise<{ slug: string }> }) {
  const searchParams = useSearchParams()
  const slug = searchParams.get('slug')
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Agendamento confirmado!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Seu agendamento foi realizado com sucesso. Você receberá uma confirmação por email com os detalhes da sua sessão.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">
              Qualquer dúvida, entre em contato com o psicólogo.
            </p>
          </div>

          <Link
            href={`/p/${slug}`}
            className="block w-full py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar para página do psicólogo
          </Link>
        </div>
      </div>
    </div>
  )
}
