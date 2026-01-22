import { state, calculateTier } from '@/lib/state'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const text = await req.text()
    console.log('Received body:', text)
    const body = JSON.parse(text)

    // Handle loyalty banner (legacy support)
    if (body.message || body.offer_code || body.cta_text) {
      state.loyaltyBanner = {
        active: true,
        message: body.message || 'Welcome back!',
        offerCode: body.offer_code || '',
        ctaText: body.cta_text || 'Learn More',
        ctaUrl: body.cta_url || '/',
      }

      return NextResponse.json({
        success: true,
        banner_id: `loyalty-${Date.now()}`,
      })
    }

    // Handle points operations
    if (body.action === 'add_points') {
      const pointsToAdd = body.points || 0
      const reason = body.reason || 'Points added'

      state.loyaltyPoints.points += pointsToAdd
      state.loyaltyPoints.tier = calculateTier(state.loyaltyPoints.points)

      // Add notification
      state.notifications.push({
        id: `notif-${Date.now()}`,
        message: `+${pointsToAdd} points! ${reason}. New balance: ${state.loyaltyPoints.points} points`,
        type: 'success',
        timestamp: Date.now(),
        durationSeconds: 6,
      })

      return NextResponse.json({
        success: true,
        points: state.loyaltyPoints.points,
        tier: state.loyaltyPoints.tier,
        pointsAdded: pointsToAdd,
      })
    }

    // Handle rule trigger (e.g., weekend appointment)
    if (body.action === 'trigger_rule') {
      const ruleId = body.rule_id
      const rule = state.loyaltyRules.find(r => r.id === ruleId && r.active)

      if (!rule) {
        return NextResponse.json({
          success: false,
          error: 'Rule not found or inactive',
        }, { status: 404 })
      }

      state.loyaltyPoints.points += rule.bonusPoints
      state.loyaltyPoints.tier = calculateTier(state.loyaltyPoints.points)

      // Add notification
      state.notifications.push({
        id: `notif-${Date.now()}`,
        message: `+${rule.bonusPoints} bonus points! ${rule.name}. New balance: ${state.loyaltyPoints.points} points`,
        type: 'success',
        timestamp: Date.now(),
        durationSeconds: 6,
      })

      return NextResponse.json({
        success: true,
        rule: rule.name,
        points: state.loyaltyPoints.points,
        tier: state.loyaltyPoints.tier,
        bonusPoints: rule.bonusPoints,
      })
    }

    // Set points directly
    if (body.action === 'set_points') {
      const newPoints = body.points || 0
      state.loyaltyPoints.points = newPoints
      state.loyaltyPoints.tier = calculateTier(newPoints)

      return NextResponse.json({
        success: true,
        points: state.loyaltyPoints.points,
        tier: state.loyaltyPoints.tier,
      })
    }

    // Add or update a rule
    if (body.action === 'set_rule') {
      const existingRuleIndex = state.loyaltyRules.findIndex(r => r.id === body.rule_id)

      const newRule = {
        id: body.rule_id || `rule-${Date.now()}`,
        name: body.name || 'Custom Rule',
        condition: body.condition || 'Custom condition',
        bonusPoints: body.bonus_points || 50,
        active: body.active !== false,
      }

      if (existingRuleIndex >= 0) {
        state.loyaltyRules[existingRuleIndex] = newRule
      } else {
        state.loyaltyRules.push(newRule)
      }

      return NextResponse.json({
        success: true,
        rule: newRule,
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Unknown action',
    }, { status: 400 })
  } catch (error) {
    console.error('Error parsing body:', error)
    return NextResponse.json(
      { success: false, error: 'Invalid request body', details: String(error) },
      { status: 400 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    loyaltyPoints: state.loyaltyPoints,
    loyaltyRules: state.loyaltyRules,
    loyaltyBanner: state.loyaltyBanner,
  })
}

export async function DELETE() {
  state.loyaltyBanner = null
  return NextResponse.json({ success: true })
}
