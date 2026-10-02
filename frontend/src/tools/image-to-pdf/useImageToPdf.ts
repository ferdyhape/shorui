import { useCallback, useEffect, useRef, useState } from 'react'
import { isAbortError } from '../../api/client'
import { build } from '../../api/imageToPdf'
import { saveBlob } from '../../lib/download'
import { MAX_FILES, MAX_IMAGE_MB } from '../../lib/limits'

const EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.tiff']

function checkFiles(files: File[], existingCount: number): string | null {
  if (existingCount + files.length > MAX_FILES) return `Too many files (max ${MAX_FILES}).`
  for (const f of files) {
    if (!EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))) {
      return `${f.name} is not a supported image type.`
    }
    if (f.size > MAX_IMAGE_MB * 1024 * 1024) return `${f.name} exceeds ${MAX_IMAGE_MB} MB.`
  }
  return null
}

export function useImageToPdf() {
  const [files, setFiles] = useState<File[]>([])
  const [outputName, setOutputName] = useState('images.pdf')
  const [busy, setBusy] = useState(false)
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

  const run = useCallback(async () => {
    if (files.length === 0) return setError('Add at least one image.')
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await build(files, outputName, controller.signal)
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
  }, [files, outputName])

  return {
    files,
    outputName,
    setOutputName,
    busy,
    error,
    notice,
    canAddMoreFiles: files.length < MAX_FILES,
    addFiles,
    removeFile,
    run,
  }
}
