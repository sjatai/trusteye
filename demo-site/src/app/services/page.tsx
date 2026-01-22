'use client'

import Link from 'next/link'
import { useState } from 'react'

const services = [
  {
    name: 'Oil Change',
    description: 'Full synthetic oil change with multi-point inspection',
    price: '$49.99',
    duration: '30 min',
  },
  {
    name: 'Tire Rotation',
    description: 'Extend tire life with professional rotation service',
    price: '$29.99',
    duration: '20 min',
  },
  {
    name: 'Brake Service',
    description: 'Inspection, pad replacement, and rotor resurfacing',
    price: 'From $149.99',
    duration: '1-2 hrs',
  },
  {
    name: 'Battery Check & Replace',
    description: 'Free battery test with replacement options available',
    price: 'Free check',
    duration: '15 min',
  },
  {
    name: 'AC Service',
    description: 'System check, refrigerant recharge, and leak detection',
    price: '$129.99',
    duration: '45 min',
  },
  {
    name: 'Full Inspection',
    description: 'Comprehensive 50-point vehicle inspection',
    price: '$79.99',
    duration: '1 hr',
  },
]

function isWeekend(): boolean {
  const day = new Date().getDay()
  return day === 0 || day === 6
}

export default function ServicesPage() {
  const [bookingService, setBookingService] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [lastBooking, setLastBooking] = useState<any>(null)

  const handleBookNow = async (serviceName: string, packageName?: string) => {
    setBookingService(serviceName || packageName || 'Service')

    try {
      const response = await fetch('/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: serviceName || packageName,
          date: new Date().toISOString(),
        }),
      })

      const data = await response.json()
      if (data.success) {
        setLastBooking(data)
        setShowModal(true)
      }
    } catch (error) {
      console.error('Failed to book appointment:', error)
    } finally {
      setBookingService(null)
    }
  }

  const weekend = isWeekend()

  return (
    <div>
      {/* Booking Success Modal */}
      {showModal && lastBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-premier-gray mb-2">Appointment Booked!</h3>
              <p className="text-gray-600 mb-4">{lastBooking.appointment.service}</p>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  +{lastBooking.loyalty.pointsEarned} Points
                </div>
                {lastBooking.loyalty.isWeekendBonus && (
                  <div className="text-sm text-green-700 flex items-center justify-center gap-1">
                    <span>🌟</span>
                    <span>Includes Weekend Bonus (+{lastBooking.loyalty.bonusPoints})</span>
                  </div>
                )}
                <div className="text-sm text-gray-600 mt-2">
                  New Balance: <span className="font-bold">{lastBooking.loyalty.newBalance.toLocaleString()}</span> points
                  <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs uppercase">
                    {lastBooking.loyalty.tier}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="bg-premier-blue hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="bg-premier-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-4">Service Center</h1>
              <p className="text-xl text-gray-300">
                Factory-trained technicians using genuine Nissan parts
              </p>
            </div>
            {weekend && (
              <div className="mt-4 md:mt-0 bg-green-500 text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 animate-pulse">
                <span className="text-2xl">🎉</span>
                <div>
                  <div className="font-bold">Weekend Bonus Active!</div>
                  <div className="text-sm text-green-100">+100 extra points on appointments</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-premier-gray mb-8">Our Services</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.name} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold text-premier-gray mb-2">{service.name}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-premier-blue font-bold text-lg">{service.price}</span>
                  <span className="text-sm text-gray-500">~{service.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-premier-gray mb-8">Service Packages</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-md">
              <h3 className="text-xl font-bold text-premier-gray mb-2">Basic Care</h3>
              <p className="text-3xl font-bold text-premier-blue mb-4">$79<span className="text-base font-normal text-gray-500">/visit</span></p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Oil change
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Tire rotation
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Fluid top-off
                </li>
              </ul>
              <button
                onClick={() => handleBookNow('Basic Care Package')}
                disabled={bookingService !== null}
                className="block w-full text-center bg-premier-blue hover:bg-blue-800 text-white py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {bookingService === 'Basic Care Package' ? 'Booking...' : 'Book Now'}
              </button>
            </div>
            <div className="bg-premier-blue text-white rounded-xl p-8 shadow-lg transform md:scale-105">
              <div className="text-xs bg-premier-red inline-block px-2 py-1 rounded mb-2">MOST POPULAR</div>
              <h3 className="text-xl font-bold mb-2">Premium Care</h3>
              <p className="text-3xl font-bold mb-4">$149<span className="text-base font-normal text-gray-300">/visit</span></p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Everything in Basic
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Brake inspection
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Battery check
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span> Filter replacement
                </li>
              </ul>
              {weekend && (
                <div className="bg-green-500/20 text-green-200 text-xs px-2 py-1 rounded mb-3 text-center">
                  +100 Weekend Bonus Points!
                </div>
              )}
              <button
                onClick={() => handleBookNow('Premium Care Package')}
                disabled={bookingService !== null}
                className="block w-full text-center bg-white text-premier-blue py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {bookingService === 'Premium Care Package' ? 'Booking...' : 'Book Now'}
              </button>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-md">
              <h3 className="text-xl font-bold text-premier-gray mb-2">Complete Care</h3>
              <p className="text-3xl font-bold text-premier-blue mb-4">$249<span className="text-base font-normal text-gray-500">/visit</span></p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Everything in Premium
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Full inspection
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> AC service check
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <span className="text-green-500">✓</span> Alignment check
                </li>
              </ul>
              <button
                onClick={() => handleBookNow('Complete Care Package')}
                disabled={bookingService !== null}
                className="block w-full text-center bg-premier-blue hover:bg-blue-800 text-white py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {bookingService === 'Complete Care Package' ? 'Booking...' : 'Book Now'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Hours */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-premier-blue text-white rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4">Service Department Hours</h2>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="font-semibold">7:00 AM - 7:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Saturday</span>
                    <span className="font-semibold">8:00 AM - 5:00 PM</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Sunday</span>
                    <span className="font-semibold">Closed</span>
                  </li>
                </ul>
              </div>
              <div className="text-center md:text-right">
                <p className="text-gray-300 mb-4">Ready to schedule your service?</p>
                <Link href="/contact" className="inline-block bg-premier-red hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  Book Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
