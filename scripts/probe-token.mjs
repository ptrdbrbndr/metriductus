const token = process.env.CF_ANALYTICS_TOKEN
if (!token) { console.error('CF_ANALYTICS_TOKEN ontbreekt'); process.exit(1) }
const z = await fetch('https://api.cloudflare.com/client/v4/zones?name=iductus.nl',
  { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
const zid = z.result?.[0]?.id
const q = { query: `query{viewer{zones(filter:{zoneTag:"${zid}"}){httpRequests1dGroups(limit:1,filter:{date_geq:"2026-07-10",date_leq:"2026-07-16"}){dimensions{date}sum{requests}}}}}` }
const r = await fetch('https://api.cloudflare.com/client/v4/graphql',
  { method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}, body: JSON.stringify(q) }).then(r=>r.json())
if (r.errors) { console.error('FAIL:', r.errors[0].message); process.exit(1) }
console.log('OK — analytics permissie werkt')
