import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, type SessionData } from '@/lib/auth'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  const isLogin = req.nextUrl.pathname === '/dashboard/login'

  if (!session.loggedIn && !isLogin) {
    const url = new URL('/dashboard/login', req.url)
    return NextResponse.redirect(url)
  }
  if (session.loggedIn && isLogin) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return res
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
}
