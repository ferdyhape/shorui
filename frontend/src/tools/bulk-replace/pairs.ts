export interface Pair {
  id: number
  find: string
  replace: string
}

let seq = 0
export const newPair = (find = '', replace = ''): Pair => ({ id: ++seq, find, replace })

export const isBlank = (pair: Pair): boolean => !pair.find.trim()
