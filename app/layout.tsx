import './globals.css'
import { Manrope } from 'next/font/google'
import Navbar from '@/components/navbar'

const manrope = Manrope({ 
  subsets: ['latin'],
  weight: ['400', '500', '700', '800']
})

export const metadata = {
  title: 'NovaOrbit | Solar Design & Savings Calculator',
  description: 'Design your solar system and calculate energy savings instantly with NovaOrbit. Get custom proposals for your home or business solar installation.',
  keywords: 'solar design, solar savings, solar calculator, solar panels, renewable energy, NovaOrbit, solar installation',
  authors: [{ name: 'NovaOrbit' }],
  openGraph: {
    title: 'NovaOrbit | Solar Design & Savings Calculator',
    description: 'Design your solar system and calculate energy savings instantly with NovaOrbit.',
    url: 'https://novaorbit.org',
    siteName: 'NovaOrbit',
    images: [
      {
        url: '/og-image.jpg', // Add your OG image
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NovaOrbit | Solar Design & Savings Calculator',
    description: 'Design your solar system and calculate energy savings instantly with NovaOrbit.',
    images: ['/twitter-image.jpg'], // Add your Twitter card image
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'icon',
      url: '/favicon-32x32.png',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 pt-24">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}