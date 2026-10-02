import { useCallback, useEffect, useRef, useState } from 'react'
import { isAbortError } from '../../api/client'
import { clean, type CleanOptions } from '../../api/docxCleaner'
import { saveBlob } from '../../lib/download'
import { MAX_UPLOAD_MB } from '../../lib/limits'

function checkFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.docx')) return 'Unsupported file type. Use .docx.'
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `File exceeds ${MAX_UPLOAD_MB} MB.`
  return null
}

/** Trivial state (one file + three toggles): a reducer would only add ceremony here. */
export function useDocxCleaner() {
  const [file, setFile] = useState<File | null>(null)
  const [options, setOptions] = useState<CleanOptions>({
    stripProperties: true,
    stripComments: true,
    acceptRevisions: true,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const chooseFile = useCallback((f: File) => {
    const problem = checkFile(f)
    setError(problem ?? '')
    setNotice('')
    setFile(problem ? null : f)
  }, [])

  const toggle = useCallback((key: keyof CleanOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const run = useCallback(async () => {
    if (!file) return
    if (!(options.stripProperties || options.stripComments || options.acceptRevisions)) {
      return setError('Select at least one cleaning option.')
    }
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await clean(file, options, controller.signal)
      saveBlob(result.blob, result.filename)
      setNotice(`Cleaned ${result.filename}.`)
    } catch (e) {
      if (!isAbortError(e)) setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setBusy(false)
      }
    }
  }, [file, options])

  return { file, options, busy, error, notice, chooseFile, toggle, run }
}
