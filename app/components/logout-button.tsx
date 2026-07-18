'use client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/dashboard/login')
    router.refresh()
  }
  return (
    <button onClick={logout} data-testid="logout" title="Uitloggen" className="logout-btn">
      Uitloggen
    </button>
  )
}
