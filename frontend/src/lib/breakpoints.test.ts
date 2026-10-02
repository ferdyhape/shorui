/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BREAKPOINTS, minWidthQuery } from './breakpoints'

const tokens = readFileSync('src/styles/tokens.css', 'utf8') // vitest runs from frontend/

describe('breakpoints', () => {
  it('mirror the --breakpoint-* tokens in tokens.css', () => {
    for (const [name, px] of Object.entries(BREAKPOINTS)) {
      expect(tokens).toContain(`--breakpoint-${name}: ${px}px`)
    }
  })

  it('keeps the responsive gutter media query aligned with the md breakpoint', () => {
    expect(tokens).toContain(`@media (min-width: ${BREAKPOINTS.md}px)`)
  })

  it('builds min-width media queries', () => {
    expect(minWidthQuery('md')).toBe('(min-width: 768px)')
  })
})
