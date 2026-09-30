import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { isAbortError } from '../../api/client'
import { extractVariables, generateDocuments, parseTable } from '../../api/textReplacer'
import { saveBlob } from '../../lib/download'
import { MAX_ROWS, MAX_UPLOAD_MB } from '../../lib/limits'
import { initialState, reducer } from './reducer'
import { isBlank, mapImportedRows, newRow } from './rows'

export type Busy = 'extract' | 'import' | 'generate' | null

function checkFile(file: File, extensions: string[]): string | null {
  if (!extensions.some((ext) => file.name.toLowerCase().endsWith(ext))) {
    return `Unsupported file type. Use ${extensions.join(' or ')}.`
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `File exceeds ${MAX_UPLOAD_MB} MB.`
  return null
}

export function useTextReplacer() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  /** Run one request at a time; a newer one cancels the older, whose result is dropped. */
  const run = useCallback(
    async <T>(kind: NonNullable<Busy>, task: (s: AbortSignal) => Promise<T>) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setBusy(kind)
      setError('')
      setNotice('')
      try {
        return await task(controller.signal)
      } catch (e) {
        if (!isAbortError(e)) setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null
          setBusy(null)
        }
      }
    },
    [],
  )

  const loadTemplate = useCallback(
    async (file: File) => {
      const problem = checkFile(file, ['.docx'])
      if (problem) return setError(problem)
      const variables = await run('extract', (s) => extractVariables(file, s))
      if (variables) dispatch({ type: 'template-loaded', file, variables })
    },
    [run],
  )

  const importRows = useCallback(
    async (file: File) => {
      const problem = checkFile(file, ['.csv', '.xlsx', '.xlsm'])
      if (problem) return setError(problem)
      const table = await run('import', (s) => parseTable(file, s))
      if (!table) return
      const { rows, ignoredColumns, missingVariables } = mapImportedRows(state.variables, table)
      dispatch({ type: 'rows-imported', rows })
      const parts = [`Imported ${rows.length} rows.`]
      if (ignoredColumns.length) parts.push(`Ignored columns: ${ignoredColumns.join(', ')}.`)
      if (missingVariables.length) parts.push(`No data for: ${missingVariables.join(', ')}.`)
      setNotice(parts.join(' '))
    },
    [run, state.variables],
  )

  const generate = useCallback(async () => {
    if (!state.file) return
    const file = state.file
    const payload = state.rows.filter((r) => !isBlank(r)).map((r) => r.values)
    if (payload.length === 0) return setError('Fill at least one row.')
    const result = await run('generate', (s) =>
      generateDocuments(file, payload, state.filenameKey, s),
    )
    if (!result) return
    saveBlob(result.blob, result.filename)
    setNotice(`Generated ${payload.length} document${payload.length > 1 ? 's' : ''}.`)
  }, [run, state.file, state.rows, state.filenameKey])

  const addRow = useCallback(() => {
    dispatch({ type: 'row-added', row: newRow() })
  }, [])

  return {
    state,
    dispatch,
    busy,
    error,
    notice,
    canAddRow: state.rows.length < MAX_ROWS,
    loadTemplate,
    importRows,
    generate,
    addRow,
  }
}
