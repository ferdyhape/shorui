import { describe, expect, it } from 'vitest'
import { computeVisibleTools, tools, visibleTools } from './tools'

describe('visibleTools (the real, env-driven export)', () => {
  it('is the full tool list for a web build (no VITE_TARGET set in this test run)', () => {
    expect(visibleTools).toHaveLength(tools.length)
    expect(visibleTools.some((t) => t.id === 'docx-to-pdf')).toBe(true)
  })
})

describe('computeVisibleTools', () => {
  it('keeps every tool for a web build', () => {
    expect(computeVisibleTools(tools, false)).toEqual(tools)
  })

  it('drops only tools opted out of the desktop build', () => {
    const result = computeVisibleTools(tools, true)
    expect(result).toHaveLength(tools.length - 1)
    expect(result.some((t) => t.id === 'docx-to-pdf')).toBe(false)
  })

  it('today, exactly docx-to-pdf is opted out (document why if this list grows)', () => {
    const optedOut = tools.filter((t) => t.desktop === false)
    expect(optedOut.map((t) => t.id)).toEqual(['docx-to-pdf'])
  })
})
