import './globals.css'
import { Manrope } from 'next/font/google'

const manrope = Manrope({ 
  subsets: ['latin'],
  weight: ['400', '500', '700', '800']
})

export const metadata = {
  title: 'Solar Design System',
  description: 'Get instant energy savings for your business',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={manrope.className}>{children}</body>
    </html>
  )
}
