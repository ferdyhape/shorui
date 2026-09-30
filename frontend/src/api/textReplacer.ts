import { BASE_URL, postForm } from './client'

export type RowValues = Record<string, string>

export interface ParsedTable {
  columns: string[]
  rows: RowValues[]
}

const PATH = '/text-replacer'

export type SampleName = 'template.docx' | 'data.csv'
export const sampleUrl = (name: SampleName) => `${BASE_URL}${PATH}/samples/${name}`

export async function extractVariables(file: File, signal?: AbortSignal): Promise<string[]> {
  const body = new FormData()
  body.append('file', file)
  const res = await postForm(`${PATH}/extract`, body, signal)
  return ((await res.json()) as { variables: string[] }).variables
}

export async function parseTable(file: File, signal?: AbortSignal): Promise<ParsedTable> {
  const body = new FormData()
  body.append('file', file)
  const res = await postForm(`${PATH}/parse-table`, body, signal)
  return (await res.json()) as ParsedTable
}

export async function generateDocuments(
  file: File,
  rows: RowValues[],
  filenameKey: string,
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  const body = new FormData()
  body.append('file', file)
  body.append('rows', JSON.stringify(rows))
  if (filenameKey) body.append('filename_key', filenameKey)
  const res = await postForm(`${PATH}/generate`, body, signal)
  const match = /filename\*=UTF-8''([^;]+)/i.exec(res.headers.get('Content-Disposition') ?? '')
  return {
    blob: await res.blob(),
    filename: match?.[1] ? decodeURIComponent(match[1]) : 'text-replacer.zip',
  }
}
