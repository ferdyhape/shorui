import { useCallback, useEffect, useRef, useState } from 'react'
import { convertToPdf } from '../../api/docxToPdf'
import { isAbortError } from '../../api/client'
import { saveBlob } from '../../lib/download'
import { MAX_UPLOAD_MB } from '../../lib/limits'

function checkFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.docx')) return 'Unsupported file type. Use .docx.'
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `File exceeds ${MAX_UPLOAD_MB} MB.`
  return null
}

/** Trivial single-file state: a reducer would only add ceremony here. */
export function useDocxToPdf() {
  const [file, setFile] = useState<File | null>(null)
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

  const convert = useCallback(async () => {
    if (!file) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await convertToPdf(file, controller.signal)
      saveBlob(result.blob, result.filename)
      setNotice(`Converted to ${result.filename}.`)
    } catch (e) {
      if (!isAbortError(e)) setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setBusy(false)
      }
    }
  }, [file])

  return { file, busy, error, notice, chooseFile, convert }
}
