'use client'

import { useState, useEffect } from 'react'

interface LoyaltyData {
  customerId: string
  customerName: string
  points: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  weekendBonusActive: boolean
  weekendBonusPoints: number
}

const tierColors = {
  bronze: 'bg-amber-600',
  silver: 'bg-gray-400',
  gold: 'bg-yellow-500',
  platinum: 'bg-purple-500',
}

const tierLabels = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
}

export default function LoyaltyPointsDisplay() {
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null)
  const [previousPoints, setPreviousPoints] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const fetchLoyalty = async () => {
      try {
        const res = await fetch('/api/loyalty')
        const data = await res.json()
        if (data.loyaltyPoints) {
          // Check if points changed
          if (previousPoints !== null && data.loyaltyPoints.points !== previousPoints) {
            setIsAnimating(true)
            setTimeout(() => setIsAnimating(false), 1000)
          }
          setPreviousPoints(data.loyaltyPoints.points)
          setLoyalty(data.loyaltyPoints)
        }
      } catch (error) {
        console.error('Failed to fetch loyalty data:', error)
      }
    }

    fetchLoyalty()
    const interval = setInterval(fetchLoyalty, 2000) // Poll every 2 seconds
    return () => clearInterval(interval)
  }, [previousPoints])

  if (!loyalty) return null

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-300 ${
          isAnimating ? 'scale-110 ring-2 ring-green-400' : ''
        }`}
      >
        <span className="text-lg">⭐</span>
        <span className={`font-bold text-white transition-all duration-300 ${isAnimating ? 'text-green-300' : ''}`}>
          {loyalty.points.toLocaleString()}
        </span>
        <span className="text-xs text-gray-300">pts</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold text-white ${tierColors[loyalty.tier]}`}>
          {tierLabels[loyalty.tier]}
        </span>
      </div>
      {loyalty.weekendBonusActive && isWeekend() && (
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs">
          <span>🎉</span>
          <span>Weekend Bonus Active!</span>
        </div>
      )}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}

function isWeekend(): boolean {
  const day = new Date().getDay()
  return day === 0 || day === 6 // Sunday = 0, Saturday = 6
}
