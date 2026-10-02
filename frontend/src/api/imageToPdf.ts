import { BASE_URL, postForm } from './client'

const PATH = '/image-to-pdf'

export type SampleName = 'sample-1.jpg' | 'sample-2.jpg'
export const sampleUrl = (name: SampleName) => `${BASE_URL}${PATH}/samples/${name}`

export async function build(
  files: File[],
  outputName: string,
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  const body = new FormData()
  files.forEach((f) => body.append('files', f))
  body.append('output_name', outputName)
  const res = await postForm(`${PATH}/build`, body, signal)
  const match = /filename\*=UTF-8''([^;]+)/i.exec(res.headers.get('Content-Disposition') ?? '')
  return {
    blob: await res.blob(),
    filename: match?.[1] ? decodeURIComponent(match[1]) : 'images.pdf',
  }
}
