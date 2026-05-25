import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register')

  // Check for Supabase auth token in cookies
  let hasSession = false
  const allCookies = req.cookies.getAll()
  
  // Supabase stores auth in cookie like: sb-<ref>-auth-token
  const sbCookie = allCookies.find(c => c.name.startsWith('sb-') && c.name.includes('auth-token'))
  if (sbCookie && sbCookie.value && sbCookie.value.length > 10) {
    hasSession = true
  }

  // If not logged in and trying to access protected page → redirect to login
  if (!hasSession && !isAuthPage) {
    const redirectUrl = new URL('/login', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If logged in and trying to access auth pages → redirect to dashboard
  if (hasSession && isAuthPage) {
    const redirectUrl = new URL('/', req.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|api).*)',
  ],
}
