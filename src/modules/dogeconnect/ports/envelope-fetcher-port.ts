export interface EnvelopeFetcherPort {
  fetchEnvelope(connectUrl: string): Promise<unknown>
}
