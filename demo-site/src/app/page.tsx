import Link from 'next/link'
import Image from 'next/image'
import DisplayAd from '@/components/DisplayAd'

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-premier-blue via-blue-800 to-premier-blue text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Welcome to Premier Nissan
              </h1>
              <p className="text-xl text-gray-300 mb-6">
                Your trusted automotive partner for 25 years
              </p>
              <p className="text-gray-300 mb-8">
                Discover our wide selection of new and certified pre-owned Nissan vehicles.
                Experience exceptional service from our award-winning team.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/inventory"
                  className="bg-premier-red hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  Browse Inventory
                </Link>
                <Link
                  href="/services"
                  className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-semibold transition-colors border border-white/30"
                >
                  Schedule Service
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative w-full max-w-lg">
                <Image
                  src="/images/nissan-gtr.webp"
                  alt="2024 Nissan GT-R"
                  width={600}
                  height={400}
                  className="rounded-xl shadow-2xl"
                  priority
                />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-premier-red text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
                  2024 Models Available
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-premier-gray mb-12">
            How Can We Help You Today?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Link href="/inventory" className="group">
              <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center">
                <div className="w-16 h-16 bg-premier-blue/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-premier-blue/20 transition-colors">
                  <span className="text-3xl">🚘</span>
                </div>
                <h3 className="text-xl font-semibold text-premier-gray mb-2">New Inventory</h3>
                <p className="text-gray-600">Explore our latest 2024 Nissan models with competitive pricing</p>
              </div>
            </Link>
            <Link href="/services" className="group">
              <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center">
                <div className="w-16 h-16 bg-premier-blue/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-premier-blue/20 transition-colors">
                  <span className="text-3xl">🔧</span>
                </div>
                <h3 className="text-xl font-semibold text-premier-gray mb-2">Service Center</h3>
                <p className="text-gray-600">Factory-trained technicians ready to keep your vehicle running</p>
              </div>
            </Link>
            <Link href="/contact" className="group">
              <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center">
                <div className="w-16 h-16 bg-premier-blue/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-premier-blue/20 transition-colors">
                  <span className="text-3xl">📍</span>
                </div>
                <h3 className="text-xl font-semibold text-premier-gray mb-2">Find a Location</h3>
                <p className="text-gray-600">Three convenient locations to serve you better</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Section with Display Ad */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-3xl font-bold text-premier-gray mb-6">Why Choose Premier Nissan?</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-premier-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-premier-gray mb-1">25 Years of Excellence</h4>
                    <p className="text-gray-600 text-sm">A quarter century of trusted service in our community</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-premier-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-premier-gray mb-1">Award-Winning Service</h4>
                    <p className="text-gray-600 text-sm">Recognized for customer satisfaction year after year</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-premier-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-premier-gray mb-1">Competitive Pricing</h4>
                    <p className="text-gray-600 text-sm">Transparent pricing with no hidden fees</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-premier-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-premier-gray mb-1">Certified Technicians</h4>
                    <p className="text-gray-600 text-sm">Factory-trained experts for your peace of mind</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <DisplayAd />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-premier-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Perfect Vehicle?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Visit any of our three locations or browse our inventory online. Our team is ready to help you find the perfect Nissan.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/inventory"
              className="bg-premier-red hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              View Inventory
            </Link>
            <Link
              href="/contact"
              className="bg-white text-premier-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
