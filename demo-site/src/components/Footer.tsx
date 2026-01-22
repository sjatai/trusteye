import Link from 'next/link'

export default function Footer() {
  const locations = [
    { name: 'Downtown', address: '123 Main St, Downtown' },
    { name: 'Riverside', address: '456 River Rd, Riverside' },
    { name: 'Valley', address: '789 Valley Blvd, Valley' },
  ]

  return (
    <footer className="bg-premier-blue text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-premier-blue font-bold">PN</span>
              </div>
              <span className="text-xl font-bold">Premier Nissan</span>
            </div>
            <p className="text-gray-300 text-sm">
              Your trusted automotive partner for 25 years. Quality vehicles, exceptional service.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/inventory" className="hover:text-white">New Vehicles</Link></li>
              <li><Link href="/inventory" className="hover:text-white">Used Vehicles</Link></li>
              <li><Link href="/services" className="hover:text-white">Service Center</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h3 className="font-semibold mb-4">Our Locations</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              {locations.map((loc) => (
                <li key={loc.name}>
                  <span className="font-medium text-white">{loc.name}:</span><br />
                  {loc.address}
                </li>
              ))}
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="font-semibold mb-4">Hours</h3>
            <ul className="space-y-1 text-gray-300 text-sm">
              <li>Mon-Fri: 9:00 AM - 8:00 PM</li>
              <li>Saturday: 9:00 AM - 6:00 PM</li>
              <li>Sunday: 11:00 AM - 5:00 PM</li>
            </ul>
            <div className="mt-4">
              <p className="text-sm">Sales: (555) 123-4567</p>
              <p className="text-sm">Service: (555) 123-4568</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-600 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Premier Nissan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
