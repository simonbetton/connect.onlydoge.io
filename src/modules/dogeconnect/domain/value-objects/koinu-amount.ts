import { type ValidationIssue, validationError } from "../shared/validation"

const KOINU_PER_DOGE = 100_000_000n
const MAX_MONEY_KOINU = 10_000_000_000n * KOINU_PER_DOGE
const MAX_MONEY_WHOLE_DOGE = MAX_MONEY_KOINU / KOINU_PER_DOGE

const KOINU_REGEX = /^(-?)(\d*)(?:\.(\d*))?$/

export class KoinuAmount {
  private constructor(
    public readonly raw: string,
    public readonly koinu: bigint
  ) {}

  static tryCreate(
    value: unknown,
    field: string
  ): { value: KoinuAmount | null; issues: ValidationIssue[] } {
    if (typeof value !== "string" || value.length === 0) {
      return {
        value: null,
        issues: [validationError(field, "required")],
      }
    }

    const parsed = parseKoinu(value)
    if (typeof parsed === "string") {
      return {
        value: null,
        issues: [validationError(field, parsed)],
      }
    }

    return {
      value: new KoinuAmount(value, parsed),
      issues: [],
    }
  }

  static tryCreateOptional(
    value: unknown,
    field: string
  ): { value: KoinuAmount | null; issues: ValidationIssue[] } {
    if (value === undefined || value === null || value === "") {
      return {
        value: null,
        issues: [],
      }
    }

    return KoinuAmount.tryCreate(value, field)
  }
}

interface KoinuMatchParts {
  sign: bigint
  wholeRaw: string
  fractionRaw: string
}

const matchKoinuParts = (value: string): KoinuMatchParts | string => {
  const match = value.match(KOINU_REGEX)
  if (!match) {
    return "invalid koinu value: invalid number (unexpected character)"
  }

  return {
    sign: match[1] === "-" ? -1n : 1n,
    wholeRaw: match[2] ?? "",
    fractionRaw: match[3] ?? "",
  }
}

const parseWholePart = (wholeRaw: string): { wholePart: bigint; wholeDigits: number } | string => {
  const wholeTrimmed = wholeRaw.replace(/^0+/, "")
  const wholeDigits = wholeTrimmed.length
  const wholePart = BigInt(wholeTrimmed || "0")

  if (wholeDigits > 11 || wholePart > MAX_MONEY_WHOLE_DOGE) {
    return "invalid koinu value: greater than max-money (10,000,000,000 DOGE)"
  }

  return { wholePart, wholeDigits }
}

const parseFractionPart = (fractionRaw: string): bigint => {
  const scaledFraction = `${fractionRaw.slice(0, 8)}00000000`.slice(0, 8)
  return BigInt(scaledFraction || "0")
}

const parseKoinu = (value: string): bigint | string => {
  const parts = matchKoinuParts(value)
  if (typeof parts === "string") {
    return parts
  }

  const wholeResult = parseWholePart(parts.wholeRaw)
  if (typeof wholeResult === "string") {
    return wholeResult
  }

  if (parts.wholeRaw.length === 0 && parts.fractionRaw.length === 0) {
    return "invalid koinu value: invalid number (unexpected character)"
  }

  const fractionPart = parseFractionPart(parts.fractionRaw)
  const unsignedTotal = wholeResult.wholePart * KOINU_PER_DOGE + fractionPart
  if (unsignedTotal > MAX_MONEY_KOINU) {
    return "invalid koinu value: greater than max-money (10,000,000,000 DOGE)"
  }

  return unsignedTotal * parts.sign
}
