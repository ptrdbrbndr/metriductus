import { createClient } from '@supabase/supabase-js'

export const db = createClient(
  process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function upsertTraffic(row: Record<string, unknown>) {
  const { error } = await db.from('daily_traffic').upsert(row, { onConflict: 'zone_name,day' })
  if (error) throw new Error(`daily_traffic: ${error.message}`)
}

export async function upsertCountries(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return
  const { error } = await db.from('daily_country').upsert(rows, { onConflict: 'zone_name,day,country' })
  if (error) throw new Error(`daily_country: ${error.message}`)
}
