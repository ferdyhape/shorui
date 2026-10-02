import { moveItem, pagesFor, rotateCw, type PageItem, type SourceFile } from './pages'
import type { FileInfo } from '../../api/pdfTools'

export interface State {
  files: SourceFile[]
  pages: PageItem[]
  outputName: string
}

export const initialState: State = { files: [], pages: [], outputName: 'merged.pdf' }

export type Action =
  | { type: 'files-added'; infos: FileInfo[] }
  | { type: 'page-rotated'; id: number }
  | { type: 'page-removed'; id: number }
  | { type: 'page-moved'; id: number; direction: 'up' | 'down' }
  | { type: 'all-cleared' }
  | { type: 'output-name-changed'; name: string }

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'files-added': {
      const files = [...state.files]
      const pages = [...state.pages]
      for (const info of action.infos) {
        const fileId = files.length
        files.push({ fileId, name: info.filename, pageCount: info.page_count })
        pages.push(...pagesFor(fileId, info))
      }
      return { ...state, files, pages }
    }
    case 'page-rotated':
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.id ? { ...p, rotate: rotateCw(p.rotate) } : p,
        ),
      }
    case 'page-removed':
      return { ...state, pages: state.pages.filter((p) => p.id !== action.id) }
    case 'page-moved': {
      const index = state.pages.findIndex((p) => p.id === action.id)
      if (index === -1) return state
      return { ...state, pages: moveItem(state.pages, index, action.direction) }
    }
    case 'all-cleared':
      return initialState
    case 'output-name-changed':
      return { ...state, outputName: action.name }
  }
}
