import { BASE_URL, postForm } from './client'

const PATH = '/docx-cleaner'

export const sampleUrl = `${BASE_URL}${PATH}/samples/sample.docx`

export interface CleanOptions {
  stripProperties: boolean
  stripComments: boolean
  acceptRevisions: boolean
}

export async function clean(
  file: File,
  options: CleanOptions,
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  const body = new FormData()
  body.append('file', file)
  body.append('strip_properties', String(options.stripProperties))
  body.append('strip_comments', String(options.stripComments))
  body.append('accept_revisions', String(options.acceptRevisions))
  const res = await postForm(`${PATH}/clean`, body, signal)
  const match = /filename\*=UTF-8''([^;]+)/i.exec(res.headers.get('Content-Disposition') ?? '')
  return {
    blob: await res.blob(),
    filename: match?.[1] ? decodeURIComponent(match[1]) : 'cleaned.docx',
  }
}
