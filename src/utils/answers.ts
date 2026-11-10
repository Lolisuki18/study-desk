/** Multiple-choice answers are stored as a string of option keys: "B" (single) or "AB" (select all that apply). */
export const isMulti = (answer: string) => answer.length > 1
export const answerKeys = (answer: string) => [...answer]
export const sameKeys = (a: string, b: string) => [...a].sort().join('') === [...b].sort().join('')
/** toggle one key in a selection string, keeping keys sorted */
export const toggleKey = (selection: string, key: string) =>
  (selection.includes(key) ? [...selection].filter((k) => k !== key) : [...selection, key]).sort().join('')
