import { type ValidationIssue, validationError } from "../shared/validation"
import { KoinuAmount } from "./koinu-amount"
import { RelayUrl } from "./relay-url"
import { Rfc3339Timestamp } from "./rfc3339-timestamp"

export const ENVELOPE_TYPE_PAYMENT = "payment"

export const ITEM_TYPE_VALUES = ["item", "tax", "fee", "shipping", "discount", "donation"] as const

export type ConnectItemType = (typeof ITEM_TYPE_VALUES)[number]

export interface ConnectItemWire {
  type: string
  id: string
  icon: string
  name: string
  desc: string
  count: number
  unit: string
  total: string
  tax: string
}

export interface ConnectOutputWire {
  address: string
  amount: string
}

export interface ConnectPaymentWire {
  type: string
  id: string
  issued: string
  timeout: number
  relay: string
  relay_token: string
  fee_per_kb: string
  max_size: number
  vendor_icon: string
  vendor_name: string
  vendor_address: string
  vendor_url: string
  vendor_order_url: string
  vendor_order_id: string
  order_reference: string
  note: string
  total: string
  fees: string
  taxes: string
  fiat_total: string
  fiat_tax: string
  fiat_currency: string
  items: ConnectItemWire[]
  outputs: ConnectOutputWire[]
}

export interface ParsedConnectItem extends ConnectItemWire {
  unitKoinu: bigint | null
  totalKoinu: bigint | null
  taxKoinu: bigint | null
}

export interface ParsedConnectOutput extends ConnectOutputWire {
  amountKoinu: bigint | null
}

export class ConnectPayment {
  private constructor(
    public readonly wire: ConnectPaymentWire,
    public readonly issuedTime: Date | null,
    public readonly totalKoinu: bigint | null,
    public readonly feePerKbKoinu: bigint | null,
    public readonly feesKoinu: bigint | null,
    public readonly taxesKoinu: bigint | null,
    public readonly parsedItems: ParsedConnectItem[],
    public readonly parsedOutputs: ParsedConnectOutput[]
  ) {}

  static parse(value: unknown): { value: ConnectPayment | null; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = []

    if (!isRecord(value)) {
      return {
        value: null,
        issues: [validationError("payload", "must be an object")],
      }
    }

    const items: ParsedConnectItem[] = []
    const outputs: ParsedConnectOutput[] = []

    const wire: ConnectPaymentWire = {
      type: readRequiredString(value, "type", issues),
      id: readRequiredString(value, "id", issues),
      issued: readRequiredString(value, "issued", issues),
      timeout: readInteger(value, "timeout", issues),
      relay: readRequiredString(value, "relay", issues),
      relay_token: readOptionalString(value, "relay_token", issues),
      fee_per_kb: readRequiredString(value, "fee_per_kb", issues),
      max_size: readInteger(value, "max_size", issues),
      vendor_icon: readOptionalString(value, "vendor_icon", issues),
      vendor_name: readRequiredString(value, "vendor_name", issues),
      vendor_address: readOptionalString(value, "vendor_address", issues),
      vendor_url: readOptionalString(value, "vendor_url", issues),
      vendor_order_url: readOptionalString(value, "vendor_order_url", issues),
      vendor_order_id: readOptionalString(value, "vendor_order_id", issues),
      order_reference: readOptionalString(value, "order_reference", issues),
      note: readOptionalString(value, "note", issues),
      total: readRequiredString(value, "total", issues),
      fees: readOptionalString(value, "fees", issues),
      taxes: readOptionalString(value, "taxes", issues),
      fiat_total: readOptionalString(value, "fiat_total", issues),
      fiat_tax: readOptionalString(value, "fiat_tax", issues),
      fiat_currency: readOptionalString(value, "fiat_currency", issues),
      items: [],
      outputs: [],
    }

    if (wire.type !== ENVELOPE_TYPE_PAYMENT) {
      issues.push(validationError("type", `must be "${ENVELOPE_TYPE_PAYMENT}"`))
    }

    const issuedResult = Rfc3339Timestamp.tryCreate(wire.issued, "issued")
    issues.push(...issuedResult.issues)

    const relayResult = RelayUrl.tryCreate(wire.relay, "relay")
    issues.push(...relayResult.issues)

    const totalResult = KoinuAmount.tryCreate(wire.total, "total")
    issues.push(...totalResult.issues)
    if (totalResult.value && totalResult.value.koinu <= 0n) {
      issues.push(validationError("total", "must be positive"))
    }

    const feePerKbResult = KoinuAmount.tryCreate(wire.fee_per_kb, "fee_per_kb")
    issues.push(...feePerKbResult.issues)

    const feesResult = KoinuAmount.tryCreateOptional(wire.fees, "fees")
    issues.push(...feesResult.issues)

    const taxesResult = KoinuAmount.tryCreateOptional(wire.taxes, "taxes")
    issues.push(...taxesResult.issues)

    if ((wire.fiat_total !== "" || wire.fiat_tax !== "") && wire.fiat_currency === "") {
      issues.push(validationError("fiat_currency", "required when fiat_total or fiat_tax is set"))
    }

    if (wire.timeout < 1) {
      issues.push(validationError("timeout", "must be > 0"))
    }

    if (wire.max_size < 1) {
      issues.push(validationError("max_size", "must be > 0"))
    }

    const rawItems = value.items
    if (rawItems === undefined || rawItems === null) {
      issues.push(validationError("items", "required (use empty array)"))
    } else if (!Array.isArray(rawItems)) {
      issues.push(validationError("items", "must be an array"))
    } else {
      rawItems.forEach((item, index) => {
        const parsedItem = parseItem(item, index, issues)
        wire.items.push(parsedItem.wire)
        items.push(parsedItem.parsed)
      })
    }

    const rawOutputs = value.outputs
    if (rawOutputs === undefined || rawOutputs === null) {
      issues.push(validationError("outputs", "required"))
    } else if (!Array.isArray(rawOutputs)) {
      issues.push(validationError("outputs", "must be an array"))
    } else if (rawOutputs.length === 0) {
      issues.push(validationError("outputs", "must have at least one output"))
    } else {
      rawOutputs.forEach((output, index) => {
        const parsedOutput = parseOutput(output, index, issues)
        wire.outputs.push(parsedOutput.wire)
        outputs.push(parsedOutput.parsed)
      })
    }

    return {
      value: new ConnectPayment(
        wire,
        issuedResult.value?.date ?? null,
        totalResult.value?.koinu ?? null,
        feePerKbResult.value?.koinu ?? null,
        feesResult.value?.koinu ?? null,
        taxesResult.value?.koinu ?? null,
        items,
        outputs
      ),
      issues,
    }
  }
}

const parseItem = (
  value: unknown,
  index: number,
  issues: ValidationIssue[]
): { wire: ConnectItemWire; parsed: ParsedConnectItem } => {
  if (!isRecord(value)) {
    issues.push(validationError(`items[${index}]`, "must be an object"))
    const fallback = createItemFallback()
    return {
      wire: fallback,
      parsed: {
        ...fallback,
        unitKoinu: null,
        totalKoinu: null,
        taxKoinu: null,
      },
    }
  }

  const wire: ConnectItemWire = {
    type: readRequiredString(value, `items[${index}].type`, issues),
    id: readRequiredString(value, `items[${index}].id`, issues),
    icon: readOptionalString(value, `items[${index}].icon`, issues),
    name: readRequiredString(value, `items[${index}].name`, issues),
    desc: readOptionalString(value, `items[${index}].desc`, issues),
    count: readInteger(value, `items[${index}].count`, issues),
    unit: readRequiredString(value, `items[${index}].unit`, issues),
    total: readRequiredString(value, `items[${index}].total`, issues),
    tax: readOptionalString(value, `items[${index}].tax`, issues),
  }

  if (!ITEM_TYPE_VALUES.includes(wire.type as ConnectItemType)) {
    issues.push(validationError(`items[${index}].type`, "invalid item type"))
  }

  if (wire.count < 1) {
    issues.push(validationError(`items[${index}].count`, "must be >= 1"))
  }

  const unitResult = KoinuAmount.tryCreate(wire.unit, `items[${index}].unit`)
  issues.push(...unitResult.issues)

  const totalResult = KoinuAmount.tryCreate(wire.total, `items[${index}].total`)
  issues.push(...totalResult.issues)

  const taxResult = KoinuAmount.tryCreateOptional(wire.tax, `items[${index}].tax`)
  issues.push(...taxResult.issues)

  if (wire.type === "discount") {
    if ((unitResult.value?.koinu ?? 0n) >= 0n) {
      issues.push(validationError(`items[${index}].unit`, "discount unit must be negative"))
    }
    if ((totalResult.value?.koinu ?? 0n) >= 0n) {
      issues.push(validationError(`items[${index}].total`, "discount total must be negative"))
    }
  }

  return {
    wire,
    parsed: {
      ...wire,
      unitKoinu: unitResult.value?.koinu ?? null,
      totalKoinu: totalResult.value?.koinu ?? null,
      taxKoinu: taxResult.value?.koinu ?? null,
    },
  }
}

const parseOutput = (
  value: unknown,
  index: number,
  issues: ValidationIssue[]
): { wire: ConnectOutputWire; parsed: ParsedConnectOutput } => {
  if (!isRecord(value)) {
    issues.push(validationError(`outputs[${index}]`, "must be an object"))
    const fallback = {
      address: "",
      amount: "",
    }
    return {
      wire: fallback,
      parsed: { ...fallback, amountKoinu: null },
    }
  }

  const wire: ConnectOutputWire = {
    address: readRequiredString(value, `outputs[${index}].address`, issues),
    amount: readRequiredString(value, `outputs[${index}].amount`, issues),
  }

  const amountResult = KoinuAmount.tryCreate(wire.amount, `outputs[${index}].amount`)
  issues.push(...amountResult.issues)
  if (amountResult.value && amountResult.value.koinu <= 0n) {
    issues.push(validationError(`outputs[${index}].amount`, "must be positive"))
  }

  return {
    wire,
    parsed: {
      ...wire,
      amountKoinu: amountResult.value?.koinu ?? null,
    },
  }
}

const createItemFallback = (): ConnectItemWire => ({
  type: "",
  id: "",
  icon: "",
  name: "",
  desc: "",
  count: 0,
  unit: "",
  total: "",
  tax: "",
})

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

const readRequiredString = (
  value: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[]
): string => {
  const candidate = value[field.split(".").pop() ?? field]

  if (typeof candidate !== "string") {
    if (candidate === undefined || candidate === null) {
      issues.push(validationError(field, "required"))
    } else {
      issues.push(validationError(field, "must be a string"))
    }
    return ""
  }

  if (candidate.length === 0) {
    issues.push(validationError(field, "required"))
  }

  return candidate
}

const readOptionalString = (
  value: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[]
): string => {
  const candidate = value[field.split(".").pop() ?? field]

  if (candidate === undefined || candidate === null) {
    return ""
  }

  if (typeof candidate !== "string") {
    issues.push(validationError(field, "must be a string"))
    return ""
  }

  return candidate
}

const readInteger = (
  value: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[]
): number => {
  const candidate = value[field.split(".").pop() ?? field]

  if (candidate === undefined || candidate === null) {
    return 0
  }

  if (typeof candidate !== "number" || !Number.isInteger(candidate)) {
    issues.push(validationError(field, "must be an integer"))
    return 0
  }

  return candidate
}
