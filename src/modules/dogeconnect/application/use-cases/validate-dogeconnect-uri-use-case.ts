import {
  hasValidationErrors,
  type ValidationIssue,
  validationError,
} from "../../domain/shared/validation"
import { DogeUri, isDogeConnectUri } from "../../domain/value-objects/doge-uri"
import { encodeRelayPubKeyHashBase64Url } from "../../domain/value-objects/relay-pub-key-hash"
import type { EnvelopeFetcherPort } from "../../ports/envelope-fetcher-port"
import type { QrValidationPayload, ValidationCheck } from "../contracts"
import type { ValidatePaymentEnvelopeUseCase } from "./validate-payment-envelope-use-case"

interface ValidateDogeConnectUriInput {
  uri: unknown
  fetchEnvelope?: boolean
}

interface ValidateDogeConnectUriDependencies {
  envelopeFetcher: EnvelopeFetcherPort
  envelopeValidator: ValidatePaymentEnvelopeUseCase
}

export const createValidateDogeConnectUriUseCase = (
  envelopeFetcher: EnvelopeFetcherPort,
  envelopeValidator: ValidatePaymentEnvelopeUseCase
) => ({
  execute: (input: ValidateDogeConnectUriInput) =>
    validateDogeConnectUri({ envelopeFetcher, envelopeValidator }, input),
})

export type ValidateDogeConnectUriUseCase = ReturnType<typeof createValidateDogeConnectUriUseCase>

const validateDogeConnectUri = async (
  dependencies: ValidateDogeConnectUriDependencies,
  input: ValidateDogeConnectUriInput
): Promise<QrValidationPayload> => {
  const checks: ValidationCheck[] = []

  const parsedUri = DogeUri.parse(input.uri)
  checks.push(buildUriParseCheck(parsedUri.issues))

  if (!parsedUri.value) {
    return invalidUriResult(checks, parsedUri.issues)
  }

  const parsed = parsedUri.value
  if (!isDogeConnectUri(parsed)) {
    return plainDogeUriResult(checks, parsedUri.issues, parsed)
  }

  checks.push({
    name: "DogeConnect params",
    passed: true,
    details: "URI includes dc/h parameters.",
  })

  const fetchEnvelope = input.fetchEnvelope ?? true
  if (!fetchEnvelope) {
    return skippedEnvelopeResult(checks, parsedUri.issues, parsed)
  }

  return fetchAndValidateEnvelope(dependencies, checks, parsedUri.issues, parsed)
}

const buildUriParseCheck = (issues: ValidationIssue[]): ValidationCheck => ({
  name: "Dogecoin URI parse",
  passed: !hasValidationErrors(issues),
  details: issues.length === 0 ? "URI parsed successfully." : "URI has validation issues.",
})

const invalidUriResult = (
  checks: ValidationCheck[],
  errors: ValidationIssue[]
): QrValidationPayload => ({
  verdict: "invalid",
  checks,
  errors,
  parsed: null,
})

const plainDogeUriResult = (
  checks: ValidationCheck[],
  errors: ValidationIssue[],
  parsed: DogeUri
): QrValidationPayload => {
  checks.push({
    name: "DogeConnect params",
    passed: true,
    details: "URI is a plain dogecoin payment URI without DogeConnect dc/h parameters.",
  })

  return {
    verdict: hasValidationErrors(errors) ? "invalid" : "inconclusive",
    checks,
    errors,
    parsed: {
      address: parsed.address,
      amount: parsed.amount,
      connectUrl: parsed.connectUrl,
      pubKeyHashBase64Url: "",
      isConnectUri: false,
    },
  }
}

const skippedEnvelopeResult = (
  checks: ValidationCheck[],
  errors: ValidationIssue[],
  parsed: DogeUri
): QrValidationPayload => {
  checks.push({
    name: "Envelope verification",
    passed: false,
    details: "Skipped envelope fetch and cryptographic verification.",
  })

  return {
    verdict: "inconclusive",
    checks,
    errors,
    parsed: toParsedQrView(parsed),
  }
}

const fetchAndValidateEnvelope = async (
  dependencies: ValidateDogeConnectUriDependencies,
  checks: ValidationCheck[],
  uriIssues: ValidationIssue[],
  parsed: DogeUri
): Promise<QrValidationPayload> => {
  try {
    const envelope = await dependencies.envelopeFetcher.fetchEnvelope(parsed.connectUrl)
    const envelopeValidation = dependencies.envelopeValidator.execute({
      envelope,
      expectedHash: parsed.pubKeyHash
        ? encodeRelayPubKeyHashBase64Url(parsed.pubKeyHash)
        : undefined,
    })

    const nestedChecks = envelopeValidation.checks.map((check) => ({
      ...check,
      name: `Envelope: ${check.name}`,
    }))

    return {
      verdict:
        envelopeValidation.verdict === "valid" && !hasValidationErrors(uriIssues)
          ? "valid"
          : "invalid",
      checks: [...checks, ...nestedChecks],
      errors: [...uriIssues, ...envelopeValidation.errors],
      parsed: toParsedQrView(parsed),
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
      errors: [...uriIssues, validationError("dc", message)],
      parsed: toParsedQrView(parsed),
    }
  }
}

const toParsedQrView = (parsed: DogeUri) => ({
  address: parsed.address,
  amount: parsed.amount,
  connectUrl: parsed.connectUrl,
  pubKeyHashBase64Url: parsed.pubKeyHash ? encodeRelayPubKeyHashBase64Url(parsed.pubKeyHash) : "",
  isConnectUri: isDogeConnectUri(parsed),
})
