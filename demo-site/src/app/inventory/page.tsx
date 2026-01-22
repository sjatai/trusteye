'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const vehicles = [
  {
    id: 1,
    name: '2024 Nissan Altima',
    type: 'New',
    price: 28500,
    mileage: 0,
    mpg: '28/39',
  },
  {
    id: 2,
    name: '2024 Nissan Rogue',
    type: 'New',
    price: 32500,
    mileage: 0,
    mpg: '26/33',
  },
  {
    id: 3,
    name: '2024 Nissan Sentra',
    type: 'New',
    price: 22500,
    mileage: 0,
    mpg: '29/39',
  },
  {
    id: 4,
    name: '2022 Nissan Maxima',
    type: 'Used',
    price: 24900,
    mileage: 28500,
    mpg: '20/30',
  },
  {
    id: 5,
    name: '2023 Nissan Pathfinder',
    type: 'Used',
    price: 38900,
    mileage: 15200,
    mpg: '21/27',
  },
  {
    id: 6,
    name: '2024 Nissan Frontier',
    type: 'New',
    price: 35500,
    mileage: 0,
    mpg: '18/24',
  },
  {
    id: 7,
    name: '2023 Nissan Murano',
    type: 'Used',
    price: 31900,
    mileage: 22100,
    mpg: '20/28',
  },
  {
    id: 8,
    name: '2024 Nissan Kicks',
    type: 'New',
    price: 23500,
    mileage: 0,
    mpg: '31/36',
  },
]

export default function InventoryPage() {
  const [filter, setFilter] = useState<'All' | 'New' | 'Used'>('All')
  const [priceRange, setPriceRange] = useState<'All' | 'Under30' | '30to40' | 'Over40'>('All')

  const filteredVehicles = vehicles.filter((v) => {
    const typeMatch = filter === 'All' || v.type === filter
    let priceMatch = true
    if (priceRange === 'Under30') priceMatch = v.price < 30000
    else if (priceRange === '30to40') priceMatch = v.price >= 30000 && v.price <= 40000
    else if (priceRange === 'Over40') priceMatch = v.price > 40000
    return typeMatch && priceMatch
  })

  return (
    <div>
      {/* Hero */}
      <section className="bg-premier-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Vehicle Inventory</h1>
          <p className="text-xl text-gray-300">
            Find your perfect Nissan from our selection of new and pre-owned vehicles
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Condition</label>
              <div className="flex gap-2">
                {(['All', 'New', 'Used'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === type
                        ? 'bg-premier-blue text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Price Range</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-premier-blue focus:border-premier-blue"
              >
                <option value="All">All Prices</option>
                <option value="Under30">Under $30,000</option>
                <option value="30to40">$30,000 - $40,000</option>
                <option value="Over40">Over $40,000</option>
              </select>
            </div>
            <div className="ml-auto text-gray-600">
              {filteredVehicles.length} vehicles found
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                  <Image
                    src="/images/nissan-gtr.webp"
                    alt={vehicle.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-premier-gray">{vehicle.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      vehicle.type === 'New' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {vehicle.type}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-premier-blue mb-2">
                    ${vehicle.price.toLocaleString()}
                  </p>
                  <div className="flex justify-between text-sm text-gray-500 mb-4">
                    <span>{vehicle.mileage > 0 ? `${vehicle.mileage.toLocaleString()} mi` : 'Brand New'}</span>
                    <span>{vehicle.mpg} MPG</span>
                  </div>
                  <Link
                    href="/contact"
                    className="block w-full text-center bg-premier-blue hover:bg-blue-800 text-white py-2 rounded-lg font-semibold transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-premier-gray mb-4">
            Don't see what you're looking for?
          </h2>
          <p className="text-gray-600 mb-6">
            Contact us and we'll help you find the perfect vehicle for your needs.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-premier-red hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  )
}
