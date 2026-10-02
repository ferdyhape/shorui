import { postForm } from './client'

const PATH = '/pdf-stamp'

export interface StampOptions {
  watermarkText: string
  pageNumbers: boolean
}

export async function stamp(
  file: File,
  options: StampOptions,
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  const body = new FormData()
  body.append('file', file)
  if (options.watermarkText.trim()) body.append('watermark_text', options.watermarkText.trim())
  body.append('page_numbers', String(options.pageNumbers))
  const res = await postForm(`${PATH}/stamp`, body, signal)
  const match = /filename\*=UTF-8''([^;]+)/i.exec(res.headers.get('Content-Disposition') ?? '')
  return {
    blob: await res.blob(),
    filename: match?.[1] ? decodeURIComponent(match[1]) : 'stamped.pdf',
  }
}
