import { newPair, type Pair } from './pairs'

export interface State {
  pairs: Pair[]
}

export const initialState: State = { pairs: [newPair()] }

export type Action =
  | { type: 'pair-added' }
  | { type: 'pair-removed'; id: number }
  | { type: 'cell-changed'; id: number; field: 'find' | 'replace'; value: string }
  | { type: 'pairs-cleared' }

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'pair-added':
      return { pairs: [...state.pairs, newPair()] }
    case 'pair-removed':
      return { pairs: state.pairs.filter((p) => p.id !== action.id) }
    case 'cell-changed':
      return {
        pairs: state.pairs.map((p) =>
          p.id === action.id ? { ...p, [action.field]: action.value } : p,
        ),
      }
    case 'pairs-cleared':
      return { pairs: [] }
  }
}
