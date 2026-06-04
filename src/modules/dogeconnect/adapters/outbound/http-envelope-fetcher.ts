import type { EnvelopeFetcherPort } from "../../ports/envelope-fetcher-port"

export class HttpEnvelopeFetcher implements EnvelopeFetcherPort {
  async fetchEnvelope(connectUrl: string): Promise<unknown> {
    const target = normalizeConnectUrl(connectUrl)
    const response = await fetch(target, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Envelope fetch failed with ${response.status} ${response.statusText}`)
    }

    try {
      return await response.json()
    } catch {
      throw new Error("Envelope response is not valid JSON")
    }
  }
}

const normalizeConnectUrl = (connectUrl: string): string => {
  if (connectUrl.startsWith("https://") || connectUrl.startsWith("http://")) {
    return connectUrl
  }
  return `https://${connectUrl}`
}
