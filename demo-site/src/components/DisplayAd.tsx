'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface AdData {
  headline: string
  body: string
  imageUrl: string
  ctaText: string
  ctaUrl: string
}

export default function DisplayAd() {
  const [ad, setAd] = useState<AdData>({
    headline: "New 2024 Models",
    body: "Explore our latest inventory of Nissan vehicles",
    imageUrl: "/images/default-ad.jpg",
    ctaText: "View Inventory",
    ctaUrl: "/inventory"
  })

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const res = await fetch('/api/state')
        const data = await res.json()
        if (data.displayAd) {
          setAd(data.displayAd)
        }
      } catch (error) {
        console.error('Failed to fetch ad state:', error)
      }
    }

    fetchAd()
    const interval = setInterval(fetchAd, 2000) // Poll every 2 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-gradient-to-br from-premier-blue to-blue-800 text-white rounded-xl overflow-hidden shadow-lg">
      {/* Ad Image Area */}
      <div className="h-40 relative overflow-hidden">
        <Image
          src="/images/nissan-gtr.webp"
          alt="Nissan Vehicle"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-premier-blue/80 to-transparent"></div>
        <div className="absolute bottom-2 left-3 text-xs text-white/80">Premier Nissan</div>
      </div>

      {/* Ad Content */}
      <div className="p-5">
        <div className="text-xs text-gray-300 uppercase tracking-wide mb-2">Special Offer</div>
        <h3 className="text-xl font-bold mb-2">{ad.headline}</h3>
        <p className="text-gray-300 text-sm mb-4">{ad.body}</p>
        <Link
          href={ad.ctaUrl}
          className="block w-full bg-premier-red hover:bg-red-700 text-white text-center py-2.5 rounded-lg font-semibold transition-colors"
        >
          {ad.ctaText}
        </Link>
      </div>

      {/* Ad Label */}
      <div className="bg-black/20 px-4 py-2 text-xs text-gray-400 text-center">
        Advertisement
      </div>
    </div>
  )
}
