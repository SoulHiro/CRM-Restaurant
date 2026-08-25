import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from './component/theme-provider'
import { Providers } from './providers'
import { Toaster } from '@repo/ui/components/sonner'
import { Geist } from 'next/font/google'

const geistSans = Geist({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Admin — Nosso Quintal',
  description: 'Painel administrativo do Nosso Quintal',
}

// Sem isso, o teclado virtual no mobile só sobrepõe a página (`h-dvh` não
// encolhe) — o app teria que adivinhar via VisualViewport. Com
// `resizes-content`, o navegador encolhe o viewport de layout de verdade
// quando o teclado abre, e todo `h-dvh`/`100dvh` do app já acompanha sozinho.
export const viewport: Viewport = {
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.className}`} cz-shortcut-listen="true">
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
