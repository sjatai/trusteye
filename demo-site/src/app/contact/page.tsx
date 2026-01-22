const locations = [
  {
    name: 'Downtown',
    address: '123 Main St, Downtown',
    phone: '(555) 123-4567',
    hours: 'Mon-Sat 9AM-8PM, Sun 11AM-5PM',
  },
  {
    name: 'Riverside',
    address: '456 River Rd, Riverside',
    phone: '(555) 234-5678',
    hours: 'Mon-Sat 9AM-8PM, Sun 11AM-5PM',
  },
  {
    name: 'Valley',
    address: '789 Valley Blvd, Valley',
    phone: '(555) 345-6789',
    hours: 'Mon-Sat 9AM-8PM, Sun 11AM-5PM',
  },
]

export default function ContactPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-premier-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-gray-300">
            Visit any of our three convenient locations
          </p>
        </div>
      </section>

      {/* Locations */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-premier-gray mb-8">Our Locations</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {locations.map((location) => (
              <div key={location.name} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="w-12 h-12 bg-premier-blue rounded-full flex items-center justify-center mb-4">
                  <span className="text-white text-xl">📍</span>
                </div>
                <h3 className="text-xl font-bold text-premier-gray mb-2">Premier Nissan {location.name}</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-premier-blue">📮</span>
                    {location.address}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-premier-blue">📞</span>
                    {location.phone}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-premier-blue">🕐</span>
                    {location.hours}
                  </li>
                </ul>
                <button className="mt-4 w-full bg-premier-blue hover:bg-blue-800 text-white py-2 rounded-lg font-semibold transition-colors">
                  Get Directions
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-64 bg-gray-200 rounded-xl flex items-center justify-center">
            <div className="text-center text-gray-500">
              <span className="text-4xl block mb-2">🗺️</span>
              <p>Interactive Map</p>
              <p className="text-sm">(Map integration would go here)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-premier-gray mb-8 text-center">Send Us a Message</h2>
          <form className="bg-white p-8 rounded-xl shadow-md">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-premier-blue focus:border-premier-blue"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-premier-blue focus:border-premier-blue"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-premier-blue focus:border-premier-blue"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-premier-blue focus:border-premier-blue"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="mb-6">
              <label htmlFor="interest" className="block text-sm font-medium text-gray-700 mb-2">
                I'm interested in...
              </label>
              <select
                id="interest"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-premier-blue focus:border-premier-blue"
              >
                <option>New Vehicle</option>
                <option>Used Vehicle</option>
                <option>Service Appointment</option>
                <option>Parts</option>
                <option>General Inquiry</option>
              </select>
            </div>
            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-premier-blue focus:border-premier-blue"
                placeholder="Tell us how we can help..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-premier-red hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
