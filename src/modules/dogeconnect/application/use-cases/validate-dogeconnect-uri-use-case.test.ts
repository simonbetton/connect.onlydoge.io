import { describe, expect, test } from "vitest"
import { NobleCryptoAdapter } from "../../adapters/crypto/noble-crypto-adapter"
import type { EnvelopeFetcherPort } from "../../ports/envelope-fetcher-port"
import { createMockDogeConnectFixture } from "./mock-dogeconnect-fixture"
import { ValidateDogeConnectUriUseCase } from "./validate-dogeconnect-uri-use-case"
import { ValidatePaymentEnvelopeUseCase } from "./validate-payment-envelope-use-case"

const PLAIN_DOGECOIN_ADDRESS = "DPD7uK4B1kRmbfGmytBhG1DZjaMWNfbpwY"
const WRONG_EXPECTED_HASH = Buffer.from(new Uint8Array(15).fill(255)).toString("base64url")

describe("ValidateDogeConnectUriUseCase", () => {
  test("returns inconclusive for a plain non-connect Dogecoin URI", async () => {
    let fetchCalled = false
    const useCase = createUseCase(async () => {
      fetchCalled = true
      throw new Error("fetcher should not be called")
    })

    const result = await useCase.execute({
      uri: `dogecoin:${PLAIN_DOGECOIN_ADDRESS}?amount=1.25`,
    })

    expect(result.verdict).toBe("inconclusive")
    expect(result.parsed?.isConnectUri).toBe(false)
    expect(fetchCalled).toBe(false)
    expect(result.checks.some((check) => check.name === "DogeConnect params" && check.passed)).toBe(
      true
    )
  })

  test("skips envelope verification when fetchEnvelope is false", async () => {
    const fixture = createMockDogeConnectFixture(new NobleCryptoAdapter(), "pay-skip")
    let fetchCalled = false
    const useCase = createUseCase(async () => {
      fetchCalled = true
      throw new Error("fetcher should not be called")
    })

    const result = await useCase.execute({
      uri: buildConnectUri(fixture),
      fetchEnvelope: false,
    })

    expect(result.verdict).toBe("inconclusive")
    expect(result.parsed?.isConnectUri).toBe(true)
    expect(fetchCalled).toBe(false)
    expect(
      result.checks.some((check) => check.name === "Envelope verification" && !check.passed)
    ).toBe(true)
  })

  test("returns invalid when envelope fetch fails", async () => {
    const fixture = createMockDogeConnectFixture(new NobleCryptoAdapter(), "pay-fetch-failure")
    const useCase = createUseCase(async () => {
      throw new Error("mock fetch failed")
    })

    const result = await useCase.execute({
      uri: buildConnectUri(fixture),
      fetchEnvelope: true,
    })

    expect(result.verdict).toBe("invalid")
    expect(result.errors.some((issue) => issue.field === "dc")).toBe(true)
    expect(result.checks.some((check) => check.name === "Envelope fetch" && !check.passed)).toBe(
      true
    )
  })

  test("returns valid for a connect URI with a fetched valid envelope", async () => {
    const fixture = createMockDogeConnectFixture(new NobleCryptoAdapter(), "pay-valid")
    const connectUrl = "example.com/dc/pay-valid"
    let fetchedUrl = ""
    const useCase = createUseCase(async (url) => {
      fetchedUrl = url
      return fixture.envelope
    })

    const result = await useCase.execute({
      uri: buildConnectUri(fixture, { connectUrl }),
      fetchEnvelope: true,
    })

    expect(fetchedUrl).toBe(connectUrl)
    expect(result.verdict).toBe("valid")
    expect(result.envelopeValidation?.verdict).toBe("valid")
  })

  test("returns invalid when URI hash does not match the fetched envelope public key", async () => {
    const fixture = createMockDogeConnectFixture(new NobleCryptoAdapter(), "pay-wrong-hash")
    const useCase = createUseCase(async () => fixture.envelope)

    const result = await useCase.execute({
      uri: buildConnectUri(fixture, { h: WRONG_EXPECTED_HASH }),
      fetchEnvelope: true,
    })

    expect(WRONG_EXPECTED_HASH).not.toBe(fixture.h)
    expect(result.verdict).toBe("invalid")
    expect(
      result.checks.some(
        (check) => check.name === "Envelope: Public key hash match" && !check.passed
      )
    ).toBe(true)
    expect(result.errors.some((issue) => issue.field === "pubkey")).toBe(true)
  })
})

const createUseCase = (fetchEnvelope: EnvelopeFetcherPort["fetchEnvelope"]) =>
  new ValidateDogeConnectUriUseCase(
    { fetchEnvelope },
    new ValidatePaymentEnvelopeUseCase(new NobleCryptoAdapter())
  )

const buildConnectUri = (
  fixture: ReturnType<typeof createMockDogeConnectFixture>,
  overrides: { connectUrl?: string; h?: string } = {}
) => {
  const query = new URLSearchParams({
    amount: fixture.amount,
    dc: overrides.connectUrl ?? `example.com/dc/${fixture.paymentId}`,
    h: overrides.h ?? fixture.h,
  })

  return `dogecoin:${fixture.address}?${query.toString()}`
}
