import { describe, expect, test } from "vitest"
import { NobleCryptoAdapter } from "../../adapters/crypto/noble-crypto-adapter"
import { expectPublicKeyHashMismatch } from "./envelope-validation-test-helpers"
import {
  createSignedEnvelopeFixture,
  createWrongExpectedHash,
} from "./signed-envelope-test-fixture"
import { ValidatePaymentEnvelopeUseCase } from "./validate-payment-envelope-use-case"

describe("ValidatePaymentEnvelopeUseCase", () => {
  test("accepts a valid signed envelope", () => {
    const fixture = createSignedEnvelopeFixture()
    const useCase = new ValidatePaymentEnvelopeUseCase(new NobleCryptoAdapter())
    const result = useCase.execute({
      envelope: fixture.envelope,
      expectedHash: fixture.expectedHash,
    })

    expect(result.verdict).toBe("valid")
    expect(result.errors.filter((issue) => issue.severity === "error")).toHaveLength(0)
    expect(result.checks.some((check) => check.name === "Envelope signature" && check.passed)).toBe(
      true
    )
  })

  test("rejects envelope with invalid signature", () => {
    const fixture = createSignedEnvelopeFixture()
    const useCase = new ValidatePaymentEnvelopeUseCase(new NobleCryptoAdapter())
    const tampered = {
      ...fixture.envelope,
      sig: `${fixture.envelope.sig.slice(0, -2)}aa`,
    }

    const result = useCase.execute({
      envelope: tampered,
      expectedHash: fixture.expectedHash,
    })

    expect(result.verdict).toBe("invalid")
    expect(result.errors.some((issue) => issue.field === "sig")).toBe(true)
  })

  test("rejects envelope when expected public key hash does not match", () => {
    const fixture = createSignedEnvelopeFixture()
    const useCase = new ValidatePaymentEnvelopeUseCase(new NobleCryptoAdapter())
    const wrongExpectedHash = createWrongExpectedHash()

    const result = useCase.execute({
      envelope: fixture.envelope,
      expectedHash: wrongExpectedHash,
    })

    expectPublicKeyHashMismatch(wrongExpectedHash, fixture.expectedHash, result)
  })
})
