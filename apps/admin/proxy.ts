import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Map: route prefix → allowed roles
const ROUTE_ROLES: Record<string, string[]> = {
  '/caixa': ['admin', 'caixa', 'cozinha'],
  '/cardapio': ['admin'],
  '/empresas': ['admin', 'caixa'],
  '/estoque': ['admin', 'cozinha'],
  '/financeiro': ['admin', 'financeiro'],
  '/funcionarios': ['admin'],
  '/fiado': ['admin', 'caixa', 'financeiro'],
  '/placar': ['admin', 'caixa', 'financeiro'],
  '/entregadores': ['admin'],
  '/configuracoes': ['admin', 'caixa'],
  '/usuarios': ['admin'],
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Verify session
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const role = (session.user as any).role as string | undefined

  // Check route-level access
  const matchedRoute = Object.keys(ROUTE_ROLES).find((route) =>
    pathname.startsWith(route)
  )

  if (matchedRoute) {
    const allowed = ROUTE_ROLES[matchedRoute] ?? []
    if (!role || !allowed.includes(role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
