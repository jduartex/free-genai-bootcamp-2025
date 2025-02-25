import { NextResponse } from 'next/server'

export async function GET() {
  if (!process.env.API_URL) {
    console.warn('API_URL not configured, using fallback theme')
    return NextResponse.json({ theme: 'system' })
  }

  try {
    const response = await fetch(`${process.env.API_URL}/settings/theme`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching theme:', error)
    // Return fallback theme on any error
    return NextResponse.json({ theme: 'system' }, { status: 200 })
  }
}

export async function POST(request: Request) {
  if (!process.env.API_URL) {
    return NextResponse.json(
      { error: 'API_URL not configured' }, 
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { theme } = body

    const response = await fetch(`${process.env.API_URL}/settings/theme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme }),
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating theme:', error)
    return NextResponse.json(
      { error: 'Failed to update theme', details: error.message }, 
      { status: 500 }
    )
  }
}
