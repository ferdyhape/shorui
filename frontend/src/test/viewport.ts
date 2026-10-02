// jsdom has no matchMedia. This stub reports a desktop viewport by default;
// tests switch with setViewport('mobile'). Installed globally from setup.ts.
type Listener = () => void

let desktop = true
const listeners = new Set<Listener>()

export function setViewport(kind: 'desktop' | 'mobile') {
  desktop = kind === 'desktop'
  listeners.forEach((l) => l())
}

export function installMatchMedia() {
  window.matchMedia = ((query: string) => ({
    media: query,
    get matches() {
      return query.includes('min-width') ? desktop : false
    },
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}
