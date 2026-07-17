'use client'

import { useEffect, useState } from 'react'

type Mode = 'light' | 'system' | 'dark'

const STORAGE_KEY = 'metriductus-theme'

function applyTheme(mode: Mode) {
  const root = document.documentElement
  if (mode === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', mode)
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // localStorage unavailable — ignore
  }
}

export function ThemeToggle({ floating = false }: { floating?: boolean }) {
  const [mode, setMode] = useState<Mode>('system')

  useEffect(() => {
    let saved: Mode = 'system'
    try {
      saved = (localStorage.getItem(STORAGE_KEY) as Mode) || 'system'
    } catch {
      // ignore
    }
    setMode(saved)
  }, [])

  function select(next: Mode) {
    setMode(next)
    applyTheme(next)
  }

  return (
    <div className={`ttoggle${floating ? ' floating' : ''}`} role="group" aria-label="Kleurthema">
      <button
        type="button"
        data-testid="theme-light"
        title="Licht"
        aria-label="Licht"
        className={mode === 'light' ? 'on' : ''}
        onClick={() => select('light')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </button>
      <button
        type="button"
        data-testid="theme-system"
        title="Systeem"
        aria-label="Systeem"
        className={mode === 'system' ? 'on' : ''}
        onClick={() => select('system')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      </button>
      <button
        type="button"
        data-testid="theme-dark"
        title="Donker"
        aria-label="Donker"
        className={mode === 'dark' ? 'on' : ''}
        onClick={() => select('dark')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      </button>
    </div>
  )
}
