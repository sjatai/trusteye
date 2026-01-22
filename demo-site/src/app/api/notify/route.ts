import { state } from '@/lib/state'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const text = await req.text()
    const body = JSON.parse(text)

    const notification = {
      id: `notif-${Date.now()}`,
      message: body.message || 'Notification',
      type: body.type || 'info',
      timestamp: Date.now(),
      durationSeconds: body.duration_seconds || 5,
    }

    state.notifications.push(notification)

    // Keep only last 10 notifications
    if (state.notifications.length > 10) {
      state.notifications = state.notifications.slice(-10)
    }

    return NextResponse.json({
      success: true,
      notification_id: notification.id,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body', details: String(error) },
      { status: 400 }
    )
  }
}

export async function GET() {
  return NextResponse.json(state.notifications)
}

export async function DELETE() {
  state.notifications = []
  return NextResponse.json({ success: true })
}
