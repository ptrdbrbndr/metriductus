import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton: avoids throwing at module-load time when env vars are
// absent (e.g. during `next build`, which collects page data for routes
// without ever invoking them). The client is only constructed on first use.
let _db: SupabaseClient | undefined

function getDb(): SupabaseClient {
  if (!_db) {
    _db = createClient(
      process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
  }
  return _db
}

export const db = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})

export async function upsertTraffic(row: Record<string, unknown>) {
  const { error } = await db.from('daily_traffic').upsert(row, { onConflict: 'zone_name,day' })
  if (error) throw new Error(`daily_traffic: ${error.message}`)
}

export async function upsertCountries(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return
  const { error } = await db.from('daily_country').upsert(rows, { onConflict: 'zone_name,day,country' })
  if (error) throw new Error(`daily_country: ${error.message}`)
}
