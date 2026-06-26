import { type ValidationIssue, validationError, validationWarning } from "../shared/validation"
import { KoinuAmount } from "./koinu-amount"
import { RelayPubKeyHash } from "./relay-pub-key-hash"

const DOGECOIN_SCHEME = "dogecoin:"

export class DogeUri {
  private constructor(
    public readonly raw: string,
    public readonly address: string,
    public readonly amount: string,
    public readonly connectUrl: string,
    public readonly pubKeyHash: RelayPubKeyHash | null
  ) {}

  static parse(value: unknown): { value: DogeUri | null; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = []

    if (typeof value !== "string" || value.length === 0) {
      return {
        value: null,
        issues: [validationError("uri", "required")],
      }
    }

    if (!value.startsWith(DOGECOIN_SCHEME)) {
      return {
        value: null,
        issues: [validationError("uri", "not a 'dogecoin' URI")],
      }
    }

    const remainder = value.slice(DOGECOIN_SCHEME.length)
    const queryIndex = remainder.indexOf("?")
    const encodedAddress = queryIndex === -1 ? remainder : remainder.slice(0, queryIndex)
    const query = queryIndex === -1 ? "" : remainder.slice(queryIndex + 1)

    const address = parseDogeUriAddress(encodedAddress, issues)
    const params = new URLSearchParams(query)
    const amount = params.get("amount") ?? ""
    const connectUrl = params.get("dc") ?? ""
    const hash = params.get("h") ?? ""

    validateDogeConnectParamPair(connectUrl, hash, issues)
    validateDogeUriAmount(amount, issues)

    const parsedHash = parseDogeUriPubKeyHash(hash, issues)
    validateDogeConnectUrlProtocol(connectUrl, issues)

    return {
      value: new DogeUri(value, address, amount, connectUrl, parsedHash),
      issues,
    }
  }
}

const parseDogeUriAddress = (encodedAddress: string, issues: ValidationIssue[]): string => {
  let address = encodedAddress
  try {
    address = decodeURIComponent(encodedAddress)
  } catch {
    issues.push(validationError("address", "invalid URI encoding"))
  }

  if (!address) {
    issues.push(validationError("address", "required"))
  }

  return address
}

const validateDogeConnectParamPair = (
  connectUrl: string,
  hash: string,
  issues: ValidationIssue[]
): void => {
  if ((connectUrl !== "") !== (hash !== "")) {
    issues.push(validationError("uri", "'dc' and 'h' parameters must both be present"))
  }
}

const validateDogeUriAmount = (amount: string, issues: ValidationIssue[]): void => {
  if (amount === "") {
    return
  }

  const amountResult = KoinuAmount.tryCreate(amount, "amount")
  issues.push(...amountResult.issues)
  if (amountResult.value && amountResult.value.koinu <= 0n) {
    issues.push(validationError("amount", "must be positive"))
  }
}

const parseDogeUriPubKeyHash = (
  hash: string,
  issues: ValidationIssue[]
): RelayPubKeyHash | null => {
  if (hash === "") {
    return null
  }

  const hashResult = RelayPubKeyHash.tryCreate(hash, "h")
  issues.push(...hashResult.issues)
  return hashResult.value
}

const validateDogeConnectUrlProtocol = (connectUrl: string, issues: ValidationIssue[]): void => {
  if (!connectUrl.startsWith("https://")) {
    return
  }

  issues.push(
    validationWarning("dc", "dc parameter usually omits protocol and should only include host/path")
  )
}

export const isDogeConnectUri = (uri: DogeUri): boolean =>
  uri.connectUrl.length > 0 && uri.pubKeyHash !== null
