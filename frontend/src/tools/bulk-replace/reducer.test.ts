import { describe, expect, it } from 'vitest'
import { initialState, reducer } from './reducer'

describe('reducer', () => {
  it('starts with one empty pair', () => {
    expect(initialState.pairs).toHaveLength(1)
    expect(initialState.pairs[0]).toMatchObject({ find: '', replace: '' })
  })

  it('adds, edits and removes pairs immutably', () => {
    const s0 = initialState
    const s1 = reducer(s0, { type: 'pair-added' })
    expect(s0.pairs).toHaveLength(1)
    expect(s1.pairs).toHaveLength(2)

    const id = s1.pairs[0]!.id
    const s2 = reducer(s1, { type: 'cell-changed', id, field: 'find', value: 'Acme' })
    expect(s2.pairs[0]!.find).toBe('Acme')
    expect(s2.pairs[1]!.find).toBe('')

    const s3 = reducer(s2, { type: 'pair-removed', id })
    expect(s3.pairs).toHaveLength(1)
  })

  it('pairs-cleared empties the list', () => {
    expect(reducer(initialState, { type: 'pairs-cleared' }).pairs).toEqual([])
  })
})
