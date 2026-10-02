import { BASE_URL, postForm } from './client'

const PATH = '/bulk-replace'

export type Pair = [find: string, replace: string]

export type SampleName = 'letter-budi.docx' | 'letter-sari.docx'
export const sampleUrl = (name: SampleName) => `${BASE_URL}${PATH}/samples/${name}`

export async function processFiles(
  files: File[],
  pairs: Pair[],
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  const body = new FormData()
  files.forEach((f) => body.append('files', f))
  body.append('pairs', JSON.stringify(pairs))
  const res = await postForm(`${PATH}/process`, body, signal)
  const match = /filename\*=UTF-8''([^;]+)/i.exec(res.headers.get('Content-Disposition') ?? '')
  return {
    blob: await res.blob(),
    filename: match?.[1] ? decodeURIComponent(match[1]) : 'bulk-replace.zip',
  }
}
