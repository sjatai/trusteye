import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoyaltyBanner from '@/components/LoyaltyBanner'
import NotificationToast from '@/components/NotificationToast'

export const metadata: Metadata = {
  title: 'Premier Nissan - Your Trusted Automotive Partner',
  description: 'Premier Nissan - Your trusted automotive partner for 25 years. New and used vehicles, service, and parts.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <LoyaltyBanner />
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <NotificationToast />
      </body>
    </html>
  )
}
