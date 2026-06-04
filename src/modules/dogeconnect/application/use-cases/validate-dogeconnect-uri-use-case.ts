import { hasValidationErrors, validationError } from "../../domain/shared/validation"
import { DogeUri } from "../../domain/value-objects/doge-uri"
import type { EnvelopeFetcherPort } from "../../ports/envelope-fetcher-port"
import type { QrValidationPayload, ValidationCheck } from "../contracts"
import type { ValidatePaymentEnvelopeUseCase } from "./validate-payment-envelope-use-case"

interface ValidateDogeConnectUriInput {
  uri: unknown
  fetchEnvelope?: boolean
}

export class ValidateDogeConnectUriUseCase {
  constructor(
    private readonly envelopeFetcher: EnvelopeFetcherPort,
    private readonly envelopeValidator: ValidatePaymentEnvelopeUseCase
  ) {}

  async execute(input: ValidateDogeConnectUriInput): Promise<QrValidationPayload> {
    const checks: ValidationCheck[] = []

    const parsedUri = DogeUri.parse(input.uri)
    checks.push({
      name: "Dogecoin URI parse",
      passed: !hasValidationErrors(parsedUri.issues),
      details:
        parsedUri.issues.length === 0 ? "URI parsed successfully." : "URI has validation issues.",
    })

    if (!parsedUri.value) {
      return {
        verdict: "invalid",
        checks,
        errors: parsedUri.issues,
        parsed: null,
      }
    }

    const parsed = parsedUri.value
    const fetchEnvelope = input.fetchEnvelope ?? true

    if (!parsed.isConnectUri) {
      checks.push({
        name: "DogeConnect params",
        passed: true,
        details: "URI is a plain dogecoin payment URI without DogeConnect dc/h parameters.",
      })
      return {
        verdict: hasValidationErrors(parsedUri.issues) ? "invalid" : "inconclusive",
        checks,
        errors: parsedUri.issues,
        parsed: {
          address: parsed.address,
          amount: parsed.amount,
          connectUrl: parsed.connectUrl,
          pubKeyHashBase64Url: "",
          isConnectUri: false,
        },
      }
    }

    checks.push({
      name: "DogeConnect params",
      passed: true,
      details: "URI includes dc/h parameters.",
    })

    if (!fetchEnvelope) {
      checks.push({
        name: "Envelope verification",
        passed: false,
        details: "Skipped envelope fetch and cryptographic verification.",
      })
      return {
        verdict: "inconclusive",
        checks,
        errors: parsedUri.issues,
        parsed: {
          address: parsed.address,
          amount: parsed.amount,
          connectUrl: parsed.connectUrl,
          pubKeyHashBase64Url: parsed.pubKeyHash?.toBase64Url() ?? "",
          isConnectUri: true,
        },
      }
    }

    try {
      const envelope = await this.envelopeFetcher.fetchEnvelope(parsed.connectUrl)
      const envelopeValidation = this.envelopeValidator.execute({
        envelope,
        expectedHash: parsed.pubKeyHash?.toBase64Url(),
      })

      const nestedChecks = envelopeValidation.checks.map((check) => ({
        ...check,
        name: `Envelope: ${check.name}`,
      }))

      return {
        verdict:
          envelopeValidation.verdict === "valid" && !hasValidationErrors(parsedUri.issues)
            ? "valid"
            : "invalid",
        checks: [...checks, ...nestedChecks],
        errors: [...parsedUri.issues, ...envelopeValidation.errors],
        parsed: {
          address: parsed.address,
          amount: parsed.amount,
          connectUrl: parsed.connectUrl,
          pubKeyHashBase64Url: parsed.pubKeyHash?.toBase64Url() ?? "",
          isConnectUri: true,
        },
        envelopeValidation,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "failed to fetch envelope"
      return {
        verdict: "invalid",
        checks: [
          ...checks,
          {
            name: "Envelope fetch",
            passed: false,
            details: message,
          },
        ],
        errors: [...parsedUri.issues, validationError("dc", message)],
        parsed: {
          address: parsed.address,
          amount: parsed.amount,
          connectUrl: parsed.connectUrl,
          pubKeyHashBase64Url: parsed.pubKeyHash?.toBase64Url() ?? "",
          isConnectUri: true,
        },
      }
    }
  }
}
