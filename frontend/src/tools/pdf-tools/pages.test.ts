import { describe, expect, it } from 'vitest'
import { moveItem, pageLabel, pagesFor, rotateCw } from './pages'

describe('pagesFor', () => {
  it('creates one item per page, 0-indexed, rotate 0', () => {
    const items = pagesFor(2, { filename: 'a.pdf', page_count: 3 })
    expect(items.map((p) => [p.fileId, p.pageIndex, p.rotate])).toEqual([
      [2, 0, 0],
      [2, 1, 0],
      [2, 2, 0],
    ])
  })
})

describe('rotateCw', () => {
  it('cycles 0 -> 90 -> 180 -> 270 -> 0', () => {
    const seen: number[] = [0]
    let r: ReturnType<typeof rotateCw> = 0
    for (let i = 0; i < 4; i++) {
      r = rotateCw(r)
      seen.push(r)
    }
    expect(seen).toEqual([0, 90, 180, 270, 0])
  })
})

describe('moveItem', () => {
  it('swaps with the neighbour in the given direction', () => {
    expect(moveItem([1, 2, 3], 1, 'up')).toEqual([2, 1, 3])
    expect(moveItem([1, 2, 3], 1, 'down')).toEqual([1, 3, 2])
  })

  it('is a no-op at the edges', () => {
    expect(moveItem([1, 2, 3], 0, 'up')).toEqual([1, 2, 3])
    expect(moveItem([1, 2, 3], 2, 'down')).toEqual([1, 2, 3])
  })
})

describe('pageLabel', () => {
  it('names the source file and 1-based page number', () => {
    const files = [{ fileId: 0, name: 'a.pdf', pageCount: 2 }]
    expect(pageLabel(files, { id: 1, fileId: 0, pageIndex: 1, rotate: 0 })).toBe('a.pdf — page 2')
  })
})
