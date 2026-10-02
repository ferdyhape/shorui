import { BASE_URL, postForm } from './client'

const PATH = '/pdf-tools'

export type SampleName = 'sample-a.pdf' | 'sample-b.pdf'
export const sampleUrl = (name: SampleName) => `${BASE_URL}${PATH}/samples/${name}`

export interface FileInfo {
  filename: string
  page_count: number
}

export interface PageOp {
  file_index: number
  page_index: number
  rotate: number
}

export async function inspectFiles(files: File[], signal?: AbortSignal): Promise<FileInfo[]> {
  const body = new FormData()
  files.forEach((f) => body.append('files', f))
  const res = await postForm(`${PATH}/inspect`, body, signal)
  return ((await res.json()) as { files: FileInfo[] }).files
}

export async function processFiles(
  files: File[],
  plan: PageOp[],
  outputName: string,
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  const body = new FormData()
  files.forEach((f) => body.append('files', f))
  body.append('plan', JSON.stringify(plan))
  body.append('output_name', outputName)
  const res = await postForm(`${PATH}/process`, body, signal)
  const match = /filename\*=UTF-8''([^;]+)/i.exec(res.headers.get('Content-Disposition') ?? '')
  return {
    blob: await res.blob(),
    filename: match?.[1] ? decodeURIComponent(match[1]) : 'merged.pdf',
  }
}
