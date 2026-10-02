import type { FileInfo } from '../../api/pdfTools'

export interface SourceFile {
  /** Index into the hook's `rawFiles` array AND the `files` field sent to the backend. */
  fileId: number
  name: string
  pageCount: number
}

export interface PageItem {
  id: number
  fileId: number
  pageIndex: number // 0-based
  rotate: 0 | 90 | 180 | 270
}

let seq = 0
const nextId = () => ++seq

/** One PageItem per page of each newly-added file, in file then page order. */
export function pagesFor(fileId: number, info: FileInfo): PageItem[] {
  return Array.from({ length: info.page_count }, (_, pageIndex) => ({
    id: nextId(),
    fileId,
    pageIndex,
    rotate: 0,
  }))
}

export function rotateCw(rotate: PageItem['rotate']): PageItem['rotate'] {
  return ((rotate + 90) % 360) as PageItem['rotate']
}

export function moveItem<T>(items: T[], index: number, direction: 'up' | 'down'): T[] {
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= items.length) return items
  const copy = [...items]
  ;[copy[index], copy[target]] = [copy[target]!, copy[index]!]
  return copy
}

export function pageLabel(files: SourceFile[], item: PageItem): string {
  const file = files.find((f) => f.fileId === item.fileId)
  return `${file?.name ?? 'file'} — page ${item.pageIndex + 1}`
}
