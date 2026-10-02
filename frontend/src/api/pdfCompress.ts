import { BASE_URL, postForm } from './client'

const PATH = '/pdf-compress'

export const sampleUrl = `${BASE_URL}${PATH}/samples/sample-photo.pdf`

export interface CompressResult {
  blob: Blob
  filename: string
  originalSize: number
  compressedSize: number
}

export async function compress(
  file: File,
  quality: number,
  signal?: AbortSignal,
): Promise<CompressResult> {
  const body = new FormData()
  body.append('file', file)
  body.append('quality', String(quality))
  const res = await postForm(`${PATH}/compress`, body, signal)
  const match = /filename\*=UTF-8''([^;]+)/i.exec(res.headers.get('Content-Disposition') ?? '')
  return {
    blob: await res.blob(),
    filename: match?.[1] ? decodeURIComponent(match[1]) : 'compressed.pdf',
    originalSize: Number(res.headers.get('X-Original-Size') ?? 0),
    compressedSize: Number(res.headers.get('X-Compressed-Size') ?? 0),
  }
}
