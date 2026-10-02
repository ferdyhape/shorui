// JS mirror of the breakpoint tokens in styles/tokens.css (which is the source of truth).
// breakpoints.test.ts fails if the two drift apart.
export const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const
export type Breakpoint = keyof typeof BREAKPOINTS

export const minWidthQuery = (bp: Breakpoint) => `(min-width: ${BREAKPOINTS[bp]}px)`
