import { describe, expect, it } from 'vitest'
import { initialState, reducer } from './reducer'

describe('reducer', () => {
  it('appends files and one page per reported page_count', () => {
    const s = reducer(initialState, {
      type: 'files-added',
      infos: [
        { filename: 'a.pdf', page_count: 2 },
        { filename: 'b.pdf', page_count: 1 },
      ],
    })
    expect(s.files).toEqual([
      { fileId: 0, name: 'a.pdf', pageCount: 2 },
      { fileId: 1, name: 'b.pdf', pageCount: 1 },
    ])
    expect(s.pages.map((p) => [p.fileId, p.pageIndex])).toEqual([
      [0, 0],
      [0, 1],
      [1, 0],
    ])
  })

  it('a second batch of files gets fileIds continuing from the first', () => {
    let s = reducer(initialState, {
      type: 'files-added',
      infos: [{ filename: 'a.pdf', page_count: 1 }],
    })
    s = reducer(s, { type: 'files-added', infos: [{ filename: 'b.pdf', page_count: 1 }] })
    expect(s.files.map((f) => f.fileId)).toEqual([0, 1])
  })

  it('rotates, removes and reorders pages', () => {
    let s = reducer(initialState, {
      type: 'files-added',
      infos: [{ filename: 'a.pdf', page_count: 2 }],
    })
    const [first, second] = s.pages
    s = reducer(s, { type: 'page-rotated', id: first!.id })
    expect(s.pages[0]!.rotate).toBe(90)

    s = reducer(s, { type: 'page-moved', id: second!.id, direction: 'up' })
    expect(s.pages.map((p) => p.id)).toEqual([second!.id, first!.id])

    s = reducer(s, { type: 'page-removed', id: first!.id })
    expect(s.pages.map((p) => p.id)).toEqual([second!.id])
  })

  it('all-cleared resets to initialState', () => {
    const s = reducer(initialState, {
      type: 'files-added',
      infos: [{ filename: 'a.pdf', page_count: 1 }],
    })
    expect(reducer(s, { type: 'all-cleared' })).toEqual(initialState)
  })

  it('output-name-changed updates only the name', () => {
    const s = reducer(initialState, { type: 'output-name-changed', name: 'x.pdf' })
    expect(s.outputName).toBe('x.pdf')
  })
})
