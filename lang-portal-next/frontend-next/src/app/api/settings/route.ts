import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const theme = await fetch(`${process.env.API_URL}/settings/theme`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const data = await theme.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching theme:', error)
    return NextResponse.json({ theme: 'system' })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { theme } = body

    const response = await fetch(`${process.env.API_URL}/settings/theme`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme }),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating theme:', error)
    return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 })
  }
}
