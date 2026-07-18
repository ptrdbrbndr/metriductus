import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type User = { email: string; hash: string }

function users(): User[] {
  // AUTH_USERS_B64 = base64(JSON) — voorkomt dat Coolify de `$` in bcrypt-hashes interpoleert.
  const raw = process.env.AUTH_USERS_B64
    ? Buffer.from(process.env.AUTH_USERS_B64, 'base64').toString('utf8')
    : process.env.AUTH_USERS || '[]'
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}))
  const norm = String(email || '').trim().toLowerCase()
  const user = users().find((u) => u.email.toLowerCase() === norm)

  const ok = user ? await bcrypt.compare(String(password || ''), user.hash) : false
  if (!ok) {
    return NextResponse.json({ error: 'Onjuist e-mailadres of wachtwoord.' }, { status: 401 })
  }

  const session = await getSession()
  session.email = user!.email
  session.loggedIn = true
  await session.save()
  return NextResponse.json({ ok: true })
}
