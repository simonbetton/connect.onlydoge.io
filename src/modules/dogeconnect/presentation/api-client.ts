export const getJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(path, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })

  const body = await readJsonBody(response)
  if (!response.ok) {
    throw createResponseError(response, body)
  }

  return body as T
}

export const postJson = async <T>(path: string, payload: unknown): Promise<T> => {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  })

  const body = await readJsonBody(response)
  if (!response.ok) {
    throw createResponseError(response, body)
  }

  return body as T
}

export const postJsonWithMeta = async (
  path: string,
  payload: unknown
): Promise<{ ok: boolean; status: number; body: unknown }> => {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  })

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
  }
}

const readJsonBody = async (response: Response): Promise<unknown> => {
  try {
    return await response.json()
  } catch {
    throw new Error("Response was not valid JSON")
  }
}

const createResponseError = (response: Response, body: unknown): Error => {
  if (!isRecord(body)) {
    return new Error(`Request failed with ${response.status}`)
  }

  if (Array.isArray(body.errors)) {
    const messages = body.errors.flatMap((issue) => {
      const formatted = formatIssue(issue)
      return formatted ? [formatted] : []
    })
    if (messages.length > 0) {
      return new Error(messages.join("; "))
    }
  }

  if (typeof body.message === "string") {
    return new Error(body.message)
  }

  return new Error(`Request failed with ${response.status}`)
}

const formatIssue = (issue: unknown): string => {
  if (isRecord(issue) && typeof issue.field === "string" && typeof issue.message === "string") {
    return `${issue.field}: ${issue.message}`
  }

  return "Request failed"
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null
