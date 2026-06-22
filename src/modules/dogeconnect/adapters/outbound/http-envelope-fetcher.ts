import type { EnvelopeFetcherPort } from "../../ports/envelope-fetcher-port"
import { safeFetchJson } from "./public-target-guard"

export class HttpEnvelopeFetcher implements EnvelopeFetcherPort {
  async fetchEnvelope(connectUrl: string): Promise<unknown> {
    const response = await safeFetchJson({
      url: connectUrl,
      method: "GET",
    })

    return response.body
  }
}
