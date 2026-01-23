import { state } from '@/lib/state'
import { NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET() {
  return NextResponse.json(state, { headers: corsHeaders })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Update displayAd if provided
    if (body.displayAd) {
      state.displayAd = {
        ...state.displayAd,
        ...body.displayAd
      }
    }

    // Update loyaltyBanner if provided
    if (body.loyaltyBanner !== undefined) {
      state.loyaltyBanner = body.loyaltyBanner
    }

    // Add notification if provided
    if (body.notification) {
      state.notifications.push({
        ...body.notification,
        id: `notif-${Date.now()}`,
        timestamp: Date.now()
      })
    }

    return NextResponse.json({ success: true, state }, { headers: corsHeaders })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400, headers: corsHeaders })
  }
}
