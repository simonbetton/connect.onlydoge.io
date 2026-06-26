export const isSearchParamRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

export const readSearchParamString = (
  record: Record<string, unknown>,
  key: string,
  options: { emptyAsUndefined?: boolean } = {}
): string | undefined => {
  if (!(key in record)) {
    return undefined
  }

  const value = record[key]
  if (typeof value === "string") {
    return options.emptyAsUndefined && value.length === 0 ? undefined : value
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    const first = value[0]
    return options.emptyAsUndefined && first.length === 0 ? undefined : first
  }

  return undefined
}

export const readSearchParamBoolean = (
  record: Record<string, unknown>,
  key: string
): boolean | undefined => {
  const value = record[key]
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    if (value === "true" || value === "1") {
      return true
    }
    if (value === "false" || value === "0") {
      return false
    }
  }

  return undefined
}

export const readSearchParamNumber = (
  record: Record<string, unknown>,
  key: string
): number | undefined => {
  const value = record[key]
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return undefined
}

export const readSearchParamStringList = (
  record: Record<string, unknown>,
  key: string
): string[] | undefined => {
  const value = record[key]
  const entries =
    typeof value === "string"
      ? value.split(",")
      : Array.isArray(value)
        ? value.flatMap((entry) => (typeof entry === "string" ? entry.split(",") : []))
        : []
  const normalized = entries.flatMap((entry) => {
    const trimmed = entry.trim()
    return trimmed ? [trimmed] : []
  })

  return normalized.length > 0 ? normalized : undefined
}

export const compactPartialSearch = <T extends Record<string, unknown>>(search: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(search).filter(([, value]) => value !== undefined)
  ) as Partial<T>
