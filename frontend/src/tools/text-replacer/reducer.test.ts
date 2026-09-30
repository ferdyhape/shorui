import { describe, expect, it } from 'vitest'
import { initialState, reducer, type State } from './reducer'
import { newRow } from './rows'

const file = new File(['x'], 'tpl.docx')

function loaded(variables: string[]): State {
  return reducer(initialState, { type: 'template-loaded', file, variables })
}

describe('reducer', () => {
  it('starts with one empty row and the first variable as filename key', () => {
    const s = loaded(['name', 'code'])
    expect(s.rows).toHaveLength(1)
    expect(s.filenameKey).toBe('name')
  })

  it('bumps templateVersion on every template load', () => {
    const first = loaded(['a'])
    const second = reducer(first, { type: 'template-loaded', file, variables: ['a'] })
    expect([first.templateVersion, second.templateVersion]).toEqual([1, 2])
  })

  it('has no rows when the template has no variables', () => {
    expect(loaded([]).rows).toEqual([])
  })

  it('keeps typed values for surviving variables when the template is replaced', () => {
    let s = loaded(['name', 'code'])
    const id = s.rows[0]!.id
    s = reducer(s, { type: 'cell-changed', id, variable: 'name', value: 'Budi' })
    s = reducer(s, { type: 'filename-key-changed', key: 'code' })
    s = reducer(s, { type: 'template-loaded', file, variables: ['code', 'name', 'city'] })
    expect(s.rows[0]!.values).toEqual({ code: '', name: 'Budi', city: '' })
    expect(s.filenameKey).toBe('code')
  })

  it('resets filename key when its variable disappears', () => {
    let s = loaded(['a', 'b'])
    s = reducer(s, { type: 'filename-key-changed', key: 'b' })
    s = reducer(s, { type: 'template-loaded', file, variables: ['a'] })
    expect(s.filenameKey).toBe('a')
  })

  it('adds, edits and removes rows immutably', () => {
    const s0 = loaded(['name'])
    const row = newRow()
    const s1 = reducer(s0, { type: 'row-added', row })
    expect(s0.rows).toHaveLength(1)
    expect(s1.rows).toHaveLength(2)
    const s2 = reducer(s1, { type: 'row-removed', id: row.id })
    expect(s2.rows).toHaveLength(1)
  })

  it('duplicates a row right after its source with the same values', () => {
    let s = loaded(['name'])
    const first = s.rows[0]!
    s = reducer(s, { type: 'cell-changed', id: first.id, variable: 'name', value: 'Budi' })
    s = reducer(s, { type: 'row-added', row: newRow({ name: 'Last' }) })
    s = reducer(s, { type: 'row-duplicated', id: first.id, newId: 999 })
    expect(s.rows.map((r) => [r.id === 999, r.values.name])).toEqual([
      [false, 'Budi'],
      [true, 'Budi'],
      [false, 'Last'],
    ])
    s = reducer(s, { type: 'cell-changed', id: 999, variable: 'name', value: 'Edited' })
    expect(s.rows[0]!.values.name).toBe('Budi') // copy is independent
  })

  it('ignores duplicating an unknown row', () => {
    const s = loaded(['name'])
    expect(reducer(s, { type: 'row-duplicated', id: -1, newId: 5 })).toBe(s)
  })

  it('import drops blank rows and appends imported ones', () => {
    let s = loaded(['name'])
    const filled = newRow({ name: 'Keep' })
    s = reducer(s, { type: 'row-added', row: filled })
    s = reducer(s, { type: 'rows-imported', rows: [newRow({ name: 'New' })] })
    expect(s.rows.map((r) => r.values.name)).toEqual(['Keep', 'New'])
  })
})
