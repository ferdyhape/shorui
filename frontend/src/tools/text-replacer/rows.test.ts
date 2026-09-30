import { describe, expect, it } from 'vitest'
import { isBlank, mapImportedRows, newRow, previewFileName } from './rows'

describe('mapImportedRows', () => {
  it('matches headers case- and space-insensitively and reports leftovers', () => {
    const result = mapImportedRows(['Name', 'code', 'city'], {
      columns: [' name ', 'CODE', 'extra'],
      rows: [{ ' name ': 'Budi', CODE: '1', extra: 'x' }],
    })
    expect(result.rows.map((r) => r.values)).toEqual([{ Name: 'Budi', code: '1' }])
    expect(result.ignoredColumns).toEqual(['extra'])
    expect(result.missingVariables).toEqual(['city'])
  })
})

describe('isBlank', () => {
  it('treats whitespace-only values as blank', () => {
    expect(isBlank(newRow({ a: ' ', b: '' }))).toBe(true)
    expect(isBlank(newRow({ a: 'x' }))).toBe(false)
  })
})

describe('previewFileName', () => {
  it('prefixes with the key value', () => {
    expect(previewFileName('offer.docx', 'name', 'Budi')).toBe('Budi_offer.docx')
  })
  it('falls back to row1 and sanitizes', () => {
    expect(previewFileName('offer.docx', 'name', '')).toBe('row1_offer.docx')
    expect(previewFileName('offer.docx', 'name', 'a/b:c')).toBe('a_b_c_offer.docx')
  })
  it('numbers when no key', () => {
    expect(previewFileName('offer.docx', '', '')).toBe('offer_1.docx')
  })
})
