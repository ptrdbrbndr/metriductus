'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandGlyph } from '../../components/brand-glyph'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (res.ok) {
      router.replace('/dashboard')
      router.refresh()
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Inloggen mislukt.')
      setBusy(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--ground)', padding: 24 }}>
      <form onSubmit={submit} data-testid="login-form"
        style={{ width: 360, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow)', padding: 30 }}>
        <div className="brand" style={{ marginBottom: 14 }}><BrandGlyph />Metriductus</div>
        <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: 22, margin: '0 0 4px' }}>Inloggen</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 22px' }}>Log in om het traffic-dashboard te bekijken.</p>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>E-mailadres</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email"
          autoComplete="username" placeholder="jij@ductus.nl"
          style={{ width: '100%', font: 'inherit', fontSize: 14, padding: '11px 12px', border: '1px solid var(--border-strong)', borderRadius: 9, background: 'var(--surface-2)', color: 'var(--ink)', marginBottom: 14 }} />

        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>Wachtwoord</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password"
          autoComplete="current-password" placeholder="••••••••"
          style={{ width: '100%', font: 'inherit', fontSize: 14, padding: '11px 12px', border: '1px solid var(--border-strong)', borderRadius: 9, background: 'var(--surface-2)', color: 'var(--ink)', marginBottom: 6 }} />

        {error && <p role="alert" style={{ color: 'var(--crit)', fontSize: 13, margin: '8px 0 0' }}>{error}</p>}

        <button type="submit" className="btn" disabled={busy} data-testid="login-submit"
          style={{ width: '100%', justifyContent: 'center', marginTop: 16, opacity: busy ? 0.7 : 1 }}>
          {busy ? 'Bezig…' : 'Inloggen'}
        </button>
      </form>
    </main>
  )
}
