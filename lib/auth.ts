import type { SessionOptions } from 'iron-session'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export type SessionData = { email?: string; loggedIn: boolean }

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'dev-only-secret-change-me-32chars-min!!',
  cookieName: 'metriductus_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  },
}

// Server-component/route helper (Node runtime).
export async function getSession() {
  const store = await cookies()
  return getIronSession<SessionData>(store, sessionOptions)
}
