import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: 'BarberPro | Gestao Inteligente para Barbearias de Elite',
  description: 'O sistema completo de gestao para barbearias com validacao via WhatsApp, BI financeiro em tempo real e agendamento sem friccao. Elimine faltas e aumente seu lucro.',
  keywords: ['barbearia', 'gestao', 'agendamento', 'whatsapp', 'financeiro', 'barbeiro'],
  authors: [{ name: 'BarberPro' }],
  openGraph: {
    title: 'BarberPro | Gestao Inteligente para Barbearias',
    description: 'Elimine faltas e organize seu financeiro em tempo real',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
