// app/api/places/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get('input')
  
  if (!input) {
    return NextResponse.json({ error: 'Input is required' }, { status: 400 })
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
  url.searchParams.append('input', input)
  url.searchParams.append('types', 'address')
  url.searchParams.append('key', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!)

  try {
    const response = await fetch(url.toString())
    const data = await response.json()
    
    if (data.status === 'REQUEST_DENIED') {
      console.error('Places API error:', data)
      return NextResponse.json({ error: 'API error' }, { status: 500 })
    }

    return NextResponse.json({
      predictions: data.predictions?.map((p: any) => p.description) || []
    })
  } catch (error) {
    console.error('Places API error:', error)
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
  }
}