import type { ParsedTable, RowValues } from '../../api/textReplacer'

export interface Row {
  id: number
  values: RowValues
}

let seq = 0
export const nextRowId = (): number => ++seq
export const newRow = (values: RowValues = {}): Row => ({ id: nextRowId(), values })

export const isBlank = (row: Row): boolean => Object.values(row.values).every((v) => !v.trim())

const norm = (s: string) => s.trim().toLowerCase()

export interface ImportResult {
  rows: Row[]
  ignoredColumns: string[]
  missingVariables: string[]
}

/** Map imported columns onto template variables (case/space-insensitive). */
export function mapImportedRows(variables: string[], table: ParsedTable): ImportResult {
  const variableByName = new Map(variables.map((v) => [norm(v), v]))
  const columnToVariable = new Map<string, string>()
  const ignoredColumns: string[] = []
  for (const column of table.columns) {
    const variable = variableByName.get(norm(column))
    if (variable) columnToVariable.set(column, variable)
    else ignoredColumns.push(column)
  }
  const matched = new Set(columnToVariable.values())
  return {
    rows: table.rows.map((r) =>
      newRow(Object.fromEntries([...columnToVariable].map(([col, v]) => [v, r[col] ?? '']))),
    ),
    ignoredColumns,
    missingVariables: variables.filter((v) => !matched.has(v)),
  }
}

// eslint-disable-next-line no-control-regex -- control characters are intentional (mirrors backend)
const INVALID_FILENAME_CHARS = /[\\/:*?"<>|\x00-\x1f]/g

/** Mirrors the backend naming rule; preview only. */
export function previewFileName(templateName: string, key: string, firstValue: string): string {
  const clean = (s: string) => s.replace(INVALID_FILENAME_CHARS, '_').replace(/^[ .]+|[ .]+$/g, '')
  const stem = clean(templateName.replace(/\.docx$/i, '')) || 'document'
  return key ? `${clean(firstValue.trim()) || 'row1'}_${stem}.docx` : `${stem}_1.docx`
}
