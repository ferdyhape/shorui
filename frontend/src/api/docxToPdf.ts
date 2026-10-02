import { BASE_URL, postForm } from './client'

const PATH = '/docx-to-pdf'

export const sampleUrl = `${BASE_URL}${PATH}/samples/sample.docx`

export async function convertToPdf(
  file: File,
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  const body = new FormData()
  body.append('file', file)
  const res = await postForm(`${PATH}/convert`, body, signal)
  const match = /filename\*=UTF-8''([^;]+)/i.exec(res.headers.get('Content-Disposition') ?? '')
  return {
    blob: await res.blob(),
    filename: match?.[1] ? decodeURIComponent(match[1]) : 'document.pdf',
  }
}
