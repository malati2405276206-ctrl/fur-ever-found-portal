// src/app/layout.js
import { Inter } from 'next/font/google'
import './globals.css'
import NavbarWrapper from '@/components/NavbarWrapper'
import LogoIntro from '@/components/LogoIntro'
import { ChatProvider } from '@/context/ChatContext'
import 'leaflet/dist/leaflet.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Fur Ever Found — Lost & Found Cat Portal',
  description: 'Helping reunite lost cats with their loving families',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LogoIntro />
        <ChatProvider>
          <NavbarWrapper />
          <main>{children}</main>
        </ChatProvider>
      </body>
    </html>
  )
}