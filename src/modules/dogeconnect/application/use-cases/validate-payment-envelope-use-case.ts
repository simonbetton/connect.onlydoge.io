import { bytesToUtf8 } from "../../domain/shared/encoding"
import {
  hasValidationErrors,
  type ValidationIssue,
  validationError,
} from "../../domain/shared/validation"
import { ConnectEnvelope } from "../../domain/value-objects/connect-envelope"
import { ConnectPayment } from "../../domain/value-objects/connect-payment"
import { RelayPubKeyHash } from "../../domain/value-objects/relay-pub-key-hash"
import type { CryptoPort } from "../../ports/crypto-port"
import type { EnvelopeValidationPayload, ValidationCheck } from "../contracts"

interface ValidatePaymentEnvelopeInput {
  envelope: unknown
  expectedHash?: string
}

export class ValidatePaymentEnvelopeUseCase {
  constructor(private readonly crypto: CryptoPort) {}

  execute(input: ValidatePaymentEnvelopeInput): EnvelopeValidationPayload {
    const checks: ValidationCheck[] = []
    const errors: ValidationIssue[] = []

    const envelopeResult = ConnectEnvelope.parse(input.envelope)
    const envelope = envelopeResult.value
    errors.push(...envelopeResult.issues)
    checks.push(buildEnvelopeStructureCheck(envelopeResult.issues))

    if (!envelope) {
      return invalidEnvelopeResult(checks, errors)
    }

    const payloadResult = decodeEnvelopePayload(envelope, checks, errors)
    const paymentValue = validateDecodedPayment(payloadResult.payload, checks, errors)

    const signatureCheck = this.verifySignature(envelope)
    checks.push(signatureCheck.check)
    if (!signatureCheck.check.passed) {
      errors.push(validationError("sig", signatureCheck.errorMessage))
    }

    if (input.expectedHash) {
      const hashCheck = this.verifyExpectedHash(envelope, input.expectedHash)
      checks.push(hashCheck.check)
      if (!hashCheck.check.passed && hashCheck.errorMessage) {
        errors.push(validationError("pubkey", hashCheck.errorMessage))
      }
    }

    return {
      verdict: hasValidationErrors(errors) ? "invalid" : "valid",
      checks,
      errors,
      envelope: {
        version: envelope.version,
        payload: envelope.payload,
        pubkey: envelope.pubkey,
        sig: envelope.signature,
      },
      payment: paymentValue ? normalizePayment(paymentValue) : null,
    }
  }

  private verifySignature(envelope: ConnectEnvelope): {
    check: ValidationCheck
    errorMessage: string
  } {
    if (!envelope.payloadBytes || !envelope.signatureBytes || !envelope.pubKeyBytes) {
      return {
        check: {
          name: "Envelope signature",
          passed: false,
          details: "Missing payload, signature, or public key bytes for verification.",
        },
        errorMessage: "not a valid signature envelope",
      }
    }

    const firstHash = this.crypto.sha256(envelope.payloadBytes)
    const secondHash = this.crypto.sha256(firstHash)
    const verified = this.crypto.verifySchnorr(
      envelope.signatureBytes,
      secondHash,
      envelope.pubKeyBytes
    )

    return {
      check: {
        name: "Envelope signature",
        passed: verified,
        details: verified
          ? "BIP-340 Schnorr signature is valid."
          : "BIP-340 Schnorr signature is invalid.",
      },
      errorMessage: "incorrect signature",
    }
  }

  private verifyExpectedHash(
    envelope: ConnectEnvelope,
    expectedHash: string
  ): { check: ValidationCheck; errorMessage: string | null } {
    const expectedResult = RelayPubKeyHash.tryCreate(expectedHash, "h")
    if (!expectedResult.value) {
      return {
        check: {
          name: "Public key hash match",
          passed: false,
          details: "Expected hash from URI is malformed.",
        },
        errorMessage: expectedResult.issues[0]?.message ?? "invalid expected hash",
      }
    }

    if (!envelope.pubKeyBytes) {
      return {
        check: {
          name: "Public key hash match",
          passed: false,
          details: "Envelope public key bytes are unavailable.",
        },
        errorMessage: "envelope public key is unavailable",
      }
    }

    const actualHash = this.crypto.sha256(envelope.pubKeyBytes).slice(0, 15)
    const actual = RelayPubKeyHash.fromBytes(actualHash)
    const passed = Boolean(actual?.equals(expectedResult.value))

    return {
      check: {
        name: "Public key hash match",
        passed,
        details: passed
          ? "Envelope public key matches URI h parameter."
          : "Envelope public key does not match URI h parameter.",
      },
      errorMessage: passed ? null : "wrong public key",
    }
  }
}

const buildEnvelopeStructureCheck = (issues: ValidationIssue[]): ValidationCheck => ({
  name: "Envelope structure",
  passed: !hasValidationErrors(issues),
  details: issues.length === 0 ? "Envelope fields are valid." : "Envelope has validation issues.",
})

const invalidEnvelopeResult = (
  checks: ValidationCheck[],
  errors: ValidationIssue[]
): EnvelopeValidationPayload => ({
  verdict: "invalid",
  checks,
  errors,
  envelope: null,
  payment: null,
})

const decodeEnvelopePayload = (
  envelope: ConnectEnvelope,
  checks: ValidationCheck[],
  errors: ValidationIssue[]
): { payload: unknown } => {
  if (!envelope.payloadBytes) {
    errors.push(validationError("payload", "cannot decode payload"))
    checks.push({
      name: "Payload JSON decode",
      passed: false,
      details: "Payload bytes could not be decoded.",
    })
    return { payload: null }
  }

  const payloadText = bytesToUtf8(envelope.payloadBytes)
  if (!payloadText) {
    errors.push(validationError("payload", "malformed UTF-8 payload"))
    checks.push({
      name: "Payload JSON decode",
      passed: false,
      details: "Payload is not valid UTF-8.",
    })
    return { payload: null }
  }

  try {
    const payload = JSON.parse(payloadText)
    checks.push({
      name: "Payload JSON decode",
      passed: true,
      details: "Payload JSON decoded successfully.",
    })
    return { payload }
  } catch {
    errors.push(validationError("payload", "malformed payload JSON"))
    checks.push({
      name: "Payload JSON decode",
      passed: false,
      details: "Payload is not valid JSON.",
    })
    return { payload: null }
  }
}

const validateDecodedPayment = (
  payload: unknown,
  checks: ValidationCheck[],
  errors: ValidationIssue[]
): ConnectPayment | null => {
  if (payload === null) {
    return null
  }

  const paymentResult = ConnectPayment.parse(payload)
  errors.push(...paymentResult.issues)
  checks.push({
    name: "Payment payload schema",
    passed: !hasValidationErrors(paymentResult.issues),
    details:
      paymentResult.issues.length === 0
        ? "Payment payload matches protocol rules."
        : "Payment payload has validation issues.",
  })
  return paymentResult.value
}

const normalizePayment = (payment: ConnectPayment): Record<string, unknown> => ({
  ...payment.wire,
  parsed: {
    issued_time: payment.issuedTime?.toISOString() ?? null,
    total_koinu: payment.totalKoinu?.toString() ?? null,
    fee_per_kb_koinu: payment.feePerKbKoinu?.toString() ?? null,
    fees_koinu: payment.feesKoinu?.toString() ?? null,
    taxes_koinu: payment.taxesKoinu?.toString() ?? null,
    items: payment.parsedItems.map(({ unitKoinu, totalKoinu, taxKoinu, ...item }) => ({
      ...item,
      unit_koinu: unitKoinu?.toString() ?? null,
      total_koinu: totalKoinu?.toString() ?? null,
      tax_koinu: taxKoinu?.toString() ?? null,
    })),
    outputs: payment.parsedOutputs.map(({ amountKoinu, ...output }) => ({
      ...output,
      amount_koinu: amountKoinu?.toString() ?? null,
    })),
  },
})
