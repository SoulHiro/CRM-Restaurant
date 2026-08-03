import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from './component/theme-provider'
import { Providers } from './providers'
import { Geist } from 'next/font/google'

const geistSans = Geist({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Admin — Nosso Quintal',
  description: 'Painel administrativo do Nosso Quintal',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
