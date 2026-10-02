import { useCallback, useEffect, useRef, useState } from 'react'
import { isAbortError } from '../../api/client'
import { compress } from '../../api/pdfCompress'
import { saveBlob } from '../../lib/download'
import { MAX_UPLOAD_MB } from '../../lib/limits'

function checkFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.pdf')) return 'Unsupported file type. Use .pdf.'
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `File exceeds ${MAX_UPLOAD_MB} MB.`
  return null
}

export interface SizeResult {
  originalSize: number
  compressedSize: number
}

/** Trivial state (one file, one quality number): a reducer would only add ceremony here. */
export function usePdfCompress() {
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState(50)
  const [result, setResult] = useState<SizeResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const chooseFile = useCallback((f: File) => {
    const problem = checkFile(f)
    setError(problem ?? '')
    setResult(null)
    setFile(problem ? null : f)
  }, [])

  const run = useCallback(async () => {
    if (!file) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const res = await compress(file, quality, controller.signal)
      saveBlob(res.blob, res.filename)
      setResult({ originalSize: res.originalSize, compressedSize: res.compressedSize })
    } catch (e) {
      if (!isAbortError(e)) setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setBusy(false)
      }
    }
  }, [file, quality])

  return { file, quality, setQuality, result, busy, error, chooseFile, run }
}
