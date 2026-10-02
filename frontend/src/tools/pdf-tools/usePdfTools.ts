import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { isAbortError } from '../../api/client'
import { inspectFiles, processFiles, type PageOp } from '../../api/pdfTools'
import { saveBlob } from '../../lib/download'
import { MAX_FILES, MAX_PDF_PAGES, MAX_UPLOAD_MB } from '../../lib/limits'
import { initialState, reducer } from './reducer'

type Busy = 'inspect' | 'process' | null

function checkFiles(files: File[], existingCount: number): string | null {
  if (existingCount + files.length > MAX_FILES) return `Too many files (max ${MAX_FILES}).`
  for (const f of files) {
    if (!f.name.toLowerCase().endsWith('.pdf')) return `${f.name} is not a .pdf file.`
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) return `${f.name} exceeds ${MAX_UPLOAD_MB} MB.`
  }
  return null
}

export function usePdfTools() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [rawFiles, setRawFiles] = useState<File[]>([])
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

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

  const addFiles = useCallback(
    async (files: File[]) => {
      const problem = checkFiles(files, rawFiles.length)
      if (problem) return setError(problem)
      const infos = await run('inspect', (s) => inspectFiles(files, s))
      if (!infos) return
      setRawFiles((prev) => [...prev, ...files])
      dispatch({ type: 'files-added', infos })
    },
    [run, rawFiles.length],
  )

  const clearAll = useCallback(() => {
    setRawFiles([])
    dispatch({ type: 'all-cleared' })
  }, [])

  const process = useCallback(async () => {
    if (state.pages.length === 0) return setError('Add at least one page to the output.')
    const plan: PageOp[] = state.pages.map((p) => ({
      file_index: p.fileId,
      page_index: p.pageIndex,
      rotate: p.rotate,
    }))
    const result = await run('process', (s) => processFiles(rawFiles, plan, state.outputName, s))
    if (!result) return
    saveBlob(result.blob, result.filename)
    setNotice(`Generated ${result.filename}.`)
  }, [run, rawFiles, state.pages, state.outputName])

  return {
    state,
    dispatch,
    busy,
    error,
    notice,
    canAddMoreFiles: state.files.length < MAX_FILES,
    canAddMorePages: state.pages.length < MAX_PDF_PAGES,
    addFiles,
    clearAll,
    process,
  }
}
