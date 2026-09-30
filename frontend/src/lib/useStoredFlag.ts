import { useCallback, useState } from 'react'

function read(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : v === 'true'
  } catch {
    return fallback // storage blocked (private mode, etc.): behave as if unset
  }
}

/** A boolean preference persisted per browser in localStorage. */
export function useStoredFlag(key: string, fallback = false) {
  const [value, setValue] = useState(() => read(key, fallback))

  const set = useCallback(
    (next: boolean) => {
      setValue(next)
      try {
        localStorage.setItem(key, String(next))
      } catch {
        // The choice just won't survive a reload; not worth surfacing.
      }
    },
    [key],
  )

  return [value, set] as const
}
