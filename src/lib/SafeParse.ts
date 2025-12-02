export function safeParse (value: any): any {
  if (!value) return null
  if (typeof value === 'object') return value
  if (typeof value !== 'string') return value
  try {
    const first = JSON.parse(value)
    if (typeof first === 'string') {
      try {
        return JSON.parse(first)
      } catch {
        return first
      }
    }
    return first
  } catch {
    return value
  }
}

