import { isBlank, newRow, type Row } from './rows'

export interface State {
  file: File | null
  variables: string[]
  rows: Row[]
  filenameKey: string
  /** Bumps on every template load; the UI uses it to move focus to the first data row. */
  templateVersion: number
}

export type Action =
  | { type: 'template-loaded'; file: File; variables: string[] }
  | { type: 'row-added'; row: Row }
  | { type: 'row-removed'; id: number }
  | { type: 'row-duplicated'; id: number; newId: number }
  | { type: 'cell-changed'; id: number; variable: string; value: string }
  | { type: 'rows-cleared' }
  | { type: 'rows-imported'; rows: Row[] }
  | { type: 'filename-key-changed'; key: string }

export const initialState: State = {
  file: null,
  variables: [],
  rows: [],
  filenameKey: '',
  templateVersion: 0,
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'template-loaded': {
      const { file, variables } = action
      // Keep what the user already typed for variables that still exist.
      const kept = state.rows.map((r) => ({
        ...r,
        values: Object.fromEntries(variables.map((v) => [v, r.values[v] ?? ''])),
      }))
      const rows = variables.length === 0 ? [] : kept.length > 0 ? kept : [newRow()]
      const filenameKey = variables.includes(state.filenameKey)
        ? state.filenameKey
        : (variables[0] ?? '')
      return { file, variables, rows, filenameKey, templateVersion: state.templateVersion + 1 }
    }
    case 'row-added':
      return { ...state, rows: [...state.rows, action.row] }
    case 'row-duplicated': {
      const index = state.rows.findIndex((r) => r.id === action.id)
      const source = state.rows[index]
      if (!source) return state
      const copy: Row = { id: action.newId, values: { ...source.values } }
      return {
        ...state,
        rows: [...state.rows.slice(0, index + 1), copy, ...state.rows.slice(index + 1)],
      }
    }
    case 'row-removed':
      return { ...state, rows: state.rows.filter((r) => r.id !== action.id) }
    case 'cell-changed':
      return {
        ...state,
        rows: state.rows.map((r) =>
          r.id === action.id
            ? { ...r, values: { ...r.values, [action.variable]: action.value } }
            : r,
        ),
      }
    case 'rows-cleared':
      return { ...state, rows: [] }
    case 'rows-imported':
      return { ...state, rows: [...state.rows.filter((r) => !isBlank(r)), ...action.rows] }
    case 'filename-key-changed':
      return { ...state, filenameKey: action.key }
  }
}
