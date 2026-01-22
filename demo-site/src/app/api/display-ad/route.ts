import { state } from '@/lib/state'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const text = await req.text()
    const body = JSON.parse(text)

    state.displayAd = {
      headline: body.headline || 'Special Offer',
      body: body.body || '',
      imageUrl: body.image_url || '/images/default-ad.jpg',
      ctaText: body.cta_text || 'Learn More',
      ctaUrl: body.cta_url || '/',
    }

    return NextResponse.json({
      success: true,
      ad_id: `ad-${Date.now()}`,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body', details: String(error) },
      { status: 400 }
    )
  }
}

export async function GET() {
  return NextResponse.json(state.displayAd)
}
