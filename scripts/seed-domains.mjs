import { createClient } from '@supabase/supabase-js'
import { DOMAINS } from '../lib/domains.ts'

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

for (const d of DOMAINS) {
  const { error } = await db.from('domains').upsert({
    zone_name: d.zoneName, label: d.label, conversion_paths: d.conversionPaths,
  }, { onConflict: 'zone_name' })
  if (error) { console.error(d.zoneName, error.message); process.exit(1) }
}
console.log(`geseed: ${DOMAINS.length} domeinen`)
