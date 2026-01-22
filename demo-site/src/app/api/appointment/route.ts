import { state, calculateTier } from '@/lib/state'
import { NextResponse } from 'next/server'

function isWeekend(): boolean {
  const day = new Date().getDay()
  return day === 0 || day === 6 // Sunday = 0, Saturday = 6
}

function getDayName(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date().getDay()]
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const serviceName = body.service || 'Service Appointment'
    const appointmentDate = body.date || new Date().toISOString()

    // Check if booking date is a weekend (or use current day for demo)
    const isWeekendBooking = body.isWeekend ?? isWeekend()
    const dayName = getDayName()

    let bonusPoints = 0
    let bonusMessage = ''

    // Apply weekend bonus if applicable
    if (isWeekendBooking) {
      const weekendRule = state.loyaltyRules.find(r => r.id === 'weekend-appointment' && r.active)
      if (weekendRule) {
        bonusPoints = weekendRule.bonusPoints
        bonusMessage = `Weekend Bonus: +${bonusPoints} points!`

        // Add points
        state.loyaltyPoints.points += bonusPoints
        state.loyaltyPoints.tier = calculateTier(state.loyaltyPoints.points)
      }
    }

    // Always give base service points
    const serviceRule = state.loyaltyRules.find(r => r.id === 'service-visit' && r.active)
    const servicePoints = serviceRule?.bonusPoints || 50
    state.loyaltyPoints.points += servicePoints
    state.loyaltyPoints.tier = calculateTier(state.loyaltyPoints.points)

    // Create notification
    const totalPoints = bonusPoints + servicePoints
    const notificationMessage = isWeekendBooking
      ? `Appointment booked! +${totalPoints} points (${dayName} bonus included). New balance: ${state.loyaltyPoints.points} points`
      : `Appointment booked! +${servicePoints} points. New balance: ${state.loyaltyPoints.points} points`

    state.notifications.push({
      id: `notif-${Date.now()}`,
      message: notificationMessage,
      type: 'success',
      timestamp: Date.now(),
      durationSeconds: 8,
    })

    return NextResponse.json({
      success: true,
      appointment: {
        id: `apt-${Date.now()}`,
        service: serviceName,
        date: appointmentDate,
        confirmed: true,
      },
      loyalty: {
        pointsEarned: totalPoints,
        bonusPoints: bonusPoints,
        servicePoints: servicePoints,
        isWeekendBonus: isWeekendBooking,
        newBalance: state.loyaltyPoints.points,
        tier: state.loyaltyPoints.tier,
      },
      message: notificationMessage,
    })
  } catch (error) {
    console.error('Error booking appointment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to book appointment', details: String(error) },
      { status: 400 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    availableSlots: [
      { date: '2026-01-25', day: 'Saturday', times: ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM'] },
      { date: '2026-01-26', day: 'Sunday', times: ['10:00 AM', '11:00 AM', '1:00 PM'] },
      { date: '2026-01-27', day: 'Monday', times: ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM'] },
    ],
    weekendBonusActive: state.loyaltyRules.find(r => r.id === 'weekend-appointment')?.active ?? false,
    weekendBonusPoints: state.loyaltyRules.find(r => r.id === 'weekend-appointment')?.bonusPoints ?? 100,
  })
}
