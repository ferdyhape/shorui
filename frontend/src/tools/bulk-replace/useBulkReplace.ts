import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { isAbortError } from '../../api/client'
import { processFiles, type Pair as ApiPair } from '../../api/bulkReplace'
import { saveBlob } from '../../lib/download'
import { MAX_FILES, MAX_ROWS, MAX_UPLOAD_MB } from '../../lib/limits'
import { initialState, reducer } from './reducer'
import { isBlank } from './pairs'

type Busy = 'process' | null

function checkFiles(files: File[], existingCount: number): string | null {
  if (existingCount + files.length > MAX_FILES) return `Too many files (max ${MAX_FILES}).`
  for (const f of files) {
    if (!f.name.toLowerCase().endsWith('.docx')) return `${f.name} is not a .docx file.`
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) return `${f.name} exceeds ${MAX_UPLOAD_MB} MB.`
  }
  return null
}

export function useBulkReplace() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const addFiles = useCallback(
    (added: File[]) => {
      const problem = checkFiles(added, files.length)
      setError(problem ?? '')
      if (!problem) setFiles((prev) => [...prev, ...added])
    },
    [files.length],
  )

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const process = useCallback(async () => {
    const pairs: ApiPair[] = state.pairs.filter((p) => !isBlank(p)).map((p) => [p.find, p.replace])
    if (files.length === 0) return setError('Add at least one .docx file.')
    if (pairs.length === 0) return setError('Add at least one find/replace pair.')

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setBusy('process')
    setError('')
    setNotice('')
    try {
      const result = await processFiles(files, pairs, controller.signal)
      saveBlob(result.blob, result.filename)
      setNotice(`Generated ${result.filename}.`)
    } catch (e) {
      if (!isAbortError(e)) setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setBusy(null)
      }
    }
  }, [files, state.pairs])

  return {
    state,
    dispatch,
    files,
    busy,
    error,
    notice,
    canAddMoreFiles: files.length < MAX_FILES,
    canAddMorePairs: state.pairs.length < MAX_ROWS,
    addFiles,
    removeFile,
    addPair: () => dispatch({ type: 'pair-added' }),
    process,
  }
}
