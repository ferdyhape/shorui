import { useSyncExternalStore } from 'react'

/** Subscribe to a CSS media query. Falls back to `fallback` where matchMedia is missing. */
export function useMediaQuery(query: string, fallback = true): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof matchMedia !== 'function') return () => {}
      const mql = matchMedia(query)
      mql.addEventListener('change', notify)
      return () => mql.removeEventListener('change', notify)
    },
    () => (typeof matchMedia === 'function' ? matchMedia(query).matches : fallback),
    () => fallback,
  )
}
