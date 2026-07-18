import { NextRequest, NextResponse } from 'next/server'
import { BEACON_ZONES } from '@/lib/domains'
import { insertLeadEvent } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Cookieloze, anonieme beacon. Geen IP/PII opgeslagen. Fire-and-forget → 204.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

function hostOf(value: string | null): string | undefined {
  if (!value) return undefined
  try {
    return new URL(value).host.replace(/^www\./, '')
  } catch {
    return undefined
  }
}

export async function POST(req: NextRequest) {
  const noContent = () => new NextResponse(null, { status: 204, headers: CORS })

  let body: { domain?: string; path?: string; type?: string; ref?: string }
  try {
    body = JSON.parse(await req.text())
  } catch {
    return noContent()
  }

  const domain = String(body.domain || '').toLowerCase().replace(/^www\./, '')
  const type = String(body.type || '')
  let path = String(body.path || '')

  // Validatie: domein op whitelist, geldig type, sane pad.
  if (!BEACON_ZONES.includes(domain)) return noContent()
  if (type !== 'pageview' && type !== 'lead') return noContent()
  if (!path.startsWith('/')) path = '/' + path
  path = path.split('?')[0].split('#')[0].slice(0, 512)

  // Zachte anti-ruis: als Origin aanwezig is moet de host bij het domein passen.
  const originHost = hostOf(req.headers.get('origin'))
  if (originHost && originHost !== domain) return noContent()

  const referrerHost = hostOf(body.ref || req.headers.get('referer'))

  try {
    await insertLeadEvent({ zone_name: domain, path, event_type: type, referrer_host: referrerHost ?? null })
  } catch {
    // stil falen — nooit 500 naar de beacon
  }
  return noContent()
}
