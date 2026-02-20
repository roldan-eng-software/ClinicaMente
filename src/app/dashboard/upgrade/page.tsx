'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createSubscription } from '@/app/actions/upgrade'

const plans: Record<string, {
  name: string
  price: string
  pricePeriod: string
  description: string
  features: { name: string; included: boolean }[]
  cta: string
  ctaDisabled: boolean
  popular?: boolean
}> = {
  free: {
    name: 'Gratuito',
    price: 'R$ 0',
    pricePeriod: '/mês',
    description: 'Para psicólogos que estão começando',
    features: [
      { name: 'Até 10 pacientes', included: true },
      { name: '20 consultas por mês', included: true },
      { name: 'Notas clínicas', included: true },
      { name: 'Lembretes automatizados', included: false },
      { name: 'Relatórios avançados', included: false },
      { name: 'Suporte prioritário', included: false },
    ],
    cta: 'Plano Atual',
    ctaDisabled: true,
  },
  pro: {
    name: 'Pro',
    price: 'R$ 97',
    pricePeriod: '/mês',
    description: 'Para profissionais que querem crescer',
    features: [
      { name: 'Até 1.000 pacientes', included: true },
      { name: 'Consultas ilimitadas', included: true },
      { name: 'Notas clínicas', included: true },
      { name: 'Lembretes automatizados', included: true },
      { name: 'Relatórios avançados', included: true },
      { name: 'Suporte prioritário', included: true },
    ],
    cta: 'Upgrade para Pro',
    ctaDisabled: false,
    popular: true,
  },
}

export default function UpgradePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cancelled = searchParams.get('cancelled')

  useEffect(() => {
    if (cancelled) {
      setError('Pagamento cancelado. Tente novamente.')
    }
  }, [cancelled])

  async function handleUpgrade() {
    setLoading(true)
    setError(null)

    const formData = new FormData()
    const result = await createSubscription(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.url) {
      window.location.href = result.url
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha o plano ideal para você
          </h1>
          <p className="text-xl text-gray-600">
            Planes flexíveis para atender suas necessidades
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
                plan.popular ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {plan.popular && (
                <div className="bg-blue-600 text-white text-center py-2 text-sm font-medium">
                  Mais Popular
                </div>
              )}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="ml-1 text-gray-500">{plan.pricePeriod}</span>
                </div>
                <p className="mt-2 text-gray-500">{plan.description}</p>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-center">
                      {feature.included ? (
                        <svg
                          className="w-5 h-5 text-green-500 mr-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-gray-300 mr-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <span className={feature.included ? 'text-gray-900' : 'text-gray-400'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleUpgrade}
                  disabled={plan.ctaDisabled || loading}
                  className={`mt-8 w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400'
                  }`}
                >
                  {loading ? 'Processando...' : plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Pagamento seguro via Stripe. Cancele anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
