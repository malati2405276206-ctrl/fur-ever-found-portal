import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'PawFinder',
  description: 'Lost and Found Cat Portal',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  )
}