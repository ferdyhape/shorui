import { useCallback, useEffect, useRef, useState } from 'react'
import { isAbortError } from '../../api/client'
import { stamp, type StampOptions } from '../../api/pdfStamp'
import { saveBlob } from '../../lib/download'
import { MAX_UPLOAD_MB } from '../../lib/limits'

function checkFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.pdf')) return 'Unsupported file type. Use .pdf.'
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `File exceeds ${MAX_UPLOAD_MB} MB.`
  return null
}

/** Trivial state (one file, a text field, a checkbox): a reducer would only add ceremony here. */
export function usePdfStamp() {
  const [file, setFile] = useState<File | null>(null)
  const [options, setOptions] = useState<StampOptions>({ watermarkText: '', pageNumbers: true })
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

  const run = useCallback(async () => {
    if (!file) return
    if (!(options.watermarkText.trim() || options.pageNumbers)) {
      return setError('Enter watermark text or enable page numbers.')
    }
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await stamp(file, options, controller.signal)
      saveBlob(result.blob, result.filename)
      setNotice(`Generated ${result.filename}.`)
    } catch (e) {
      if (!isAbortError(e)) setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setBusy(false)
      }
    }
  }, [file, options])

  return { file, options, setOptions, busy, error, notice, chooseFile, run }
}
