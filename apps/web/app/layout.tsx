import type { Metadata } from 'next'
import { JetBrains_Mono, Sarabun } from 'next/font/google'
import { Providers } from './providers'
import { ShellGate } from './shell-gate'
import './globals.css'
import { cn } from '@/app/common/utils'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ศูนย์ HA | โรงพยาบาลมหาวิทยาลัยพะเยา',
  description: 'ระบบศูนย์ประสานงานและส่งเสริมการพัฒนาคุณภาพโรงพยาบาลตามมาตรฐาน HA',
  icons: {
    icon: '/logo2.png',
    apple: '/logo2.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={cn(sarabun.variable, jetbrainsMono.variable)}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>
          <ShellGate>{children}</ShellGate>
        </Providers>
      </body>
    </html>
  )
}
