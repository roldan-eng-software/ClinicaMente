import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cep = searchParams.get('cep')

  if (!cep) {
    return NextResponse.json(
      { error: 'CEP é obrigatório' },
      { status: 400 }
    )
  }

  const cleanCep = cep.replace(/\D/g, '')

  if (cleanCep.length !== 8) {
    return NextResponse.json(
      { error: 'CEP inválido. Deve conter 8 dígitos.' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(
      `https://viacep.com.br/ws/${cleanCep}/json/`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch')
    }

    const data = await response.json()

    if (data.erro) {
      return NextResponse.json(
        { error: 'CEP não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      cep: data.cep,
      logradouro: data.logradouro || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      estado: data.uf || '',
      ibge: data.ibge || '',
      gia: data.gia || '',
    })
  } catch (error) {
    console.error('Error fetching CEP:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar CEP. Tente novamente.' },
      { status: 500 }
    )
  }
}
