import { useEffect, useState } from 'react'
import { Icon, type IconName } from '../core/Icon'

// index.html's inline script reads this same key before React mounts (no theme flash).
export const THEME_STORAGE_KEY = 'shorui:theme'

type Theme = 'light' | 'dark' | 'system'

const OPTIONS: { value: Theme; icon: IconName; label: string }[] = [
  { value: 'light', icon: 'sun', label: 'Light' },
  { value: 'system', icon: 'monitor', label: 'Match system' },
  { value: 'dark', icon: 'moon', label: 'Dark' },
]

function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

// 'system' = no explicit choice: drop the attribute so prefers-color-scheme decides.
function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // The choice just won't survive a reload; not worth surfacing.
    }
  }, [theme])

  return (
    <div
      className="flex items-center gap-0.5 rounded-md border border-border bg-surface-sunken p-0.5"
      role="radiogroup"
      aria-label="Theme"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={theme === o.value}
          aria-label={o.label}
          title={o.label}
          onClick={() => setTheme(o.value)}
          className={`focus-ring flex h-6 flex-1 cursor-pointer items-center justify-center rounded-sm transition-colors duration-120 ${
            theme === o.value
              ? 'bg-surface-card text-ink shadow-xs'
              : 'text-ink-faint hover:text-ink'
          }`}
        >
          <Icon name={o.icon} size={13} />
        </button>
      ))}
    </div>
  )
}
