'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface BannerData {
  active: boolean
  message: string
  offerCode: string
  ctaText: string
  ctaUrl: string
}

export default function LoyaltyBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await fetch('/api/state')
        const data = await res.json()
        if (data.loyaltyBanner && data.loyaltyBanner.active) {
          setBanner(data.loyaltyBanner)
          setDismissed(false)
        } else {
          setBanner(null)
        }
      } catch (error) {
        console.error('Failed to fetch banner state:', error)
      }
    }

    fetchBanner()
    const interval = setInterval(fetchBanner, 2000) // Poll every 2 seconds
    return () => clearInterval(interval)
  }, [])

  if (!banner || dismissed) return null

  return (
    <div className="bg-gradient-to-r from-premier-red to-red-700 text-white py-3 px-4 relative">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎁</span>
          <p className="font-medium text-center sm:text-left">{banner.message}</p>
        </div>
        {banner.offerCode && (
          <div className="bg-white/20 px-3 py-1 rounded font-mono font-bold">
            {banner.offerCode}
          </div>
        )}
        <Link
          href={banner.ctaUrl}
          className="bg-white text-premier-red px-4 py-1.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          {banner.ctaText}
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
        aria-label="Dismiss banner"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
