import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const response = await fetch(
      `${supabaseUrl}/functions/v1/review-inactive-patients`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    )

    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error triggering review-inactive-patients:', error)
    return NextResponse.json(
      { error: 'Failed to trigger function' },
      { status: 500 }
    )
  }
}
