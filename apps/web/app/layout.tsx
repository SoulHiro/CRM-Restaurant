import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from '@repo/ui/components/sonner'
import { ThemeProvider } from './component/theme-provider'
import { Providers } from './providers'
import { Geist } from 'next/font/google'

const geistSans = Geist({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Nosso Quintal — Cardápio da semana',
  description: 'Responda o cardápio da semana da sua empresa.',
}

// Pinta a barra de endereço do navegador mobile pra combinar com o banner
// dourado-sobre-madeira do formulário — mesmo tom escuro do tema dark do
// resto do sistema (ver packages/ui/src/styles/globals.css).
export const viewport: Viewport = {
  themeColor: '#1a1206',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
