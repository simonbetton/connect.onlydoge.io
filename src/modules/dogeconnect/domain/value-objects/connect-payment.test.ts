import { describe, expect, test } from "vitest"
import { hasValidationErrors } from "../shared/validation"
import { ConnectPayment } from "./connect-payment"

const OUTPUT_ADDRESS = "DPD7uK4B1kRmbfGmytBhG1DZjaMWNfbpwY"

type PaymentFixture = Record<string, unknown>

describe("ConnectPayment", () => {
  test("parses a valid minimal payment without error-severity issues", () => {
    const result = ConnectPayment.parse(validPayment())

    expect(result.value).not.toBeNull()
    expect(hasValidationErrors(result.issues)).toBe(false)
    expect(result.value?.wire.id).toBe("pay-1")
  })

  test.each([
    {
      name: "missing id",
      mutate: (payment: PaymentFixture) => {
        delete payment.id
      },
      expectedField: "id",
    },
    {
      name: "missing relay",
      mutate: (payment: PaymentFixture) => {
        delete payment.relay
      },
      expectedField: "relay",
    },
    {
      name: "missing total",
      mutate: (payment: PaymentFixture) => {
        delete payment.total
      },
      expectedField: "total",
    },
    {
      name: "invalid item type",
      mutate: (payment: PaymentFixture) => {
        payment.items = [{ ...validItem(), type: "unsupported" }]
      },
      expectedField: "items[0].type",
    },
    {
      name: "malformed output amounts",
      mutate: (payment: PaymentFixture) => {
        payment.outputs = [{ address: OUTPUT_ADDRESS, amount: "not-a-number" }]
      },
      expectedField: "outputs[0].amount",
    },
  ])("reports validation errors for $name", ({ mutate, expectedField }) => {
    expectFieldValidationError(mutate, expectedField)
  })

  test("rejects an invalid payment type", () => {
    expectFieldValidationError((payment) => {
      payment.type = "invoice"
    }, "type")
  })

  test("reports invalid relay URLs", () => {
    expectFieldValidationError((payment) => {
      payment.relay = "http://example.com/dc/pay-1"
    }, "relay")
  })

  test("requires fiat_currency when fiat totals are present", () => {
    const payment = validPayment()
    payment.fiat_total = "12.00"
    const result = ConnectPayment.parse(payment)
    expect(hasValidationErrors(result.issues)).toBe(true)
    expect(result.issues.some((issue) => issue.field === "fiat_currency")).toBe(true)
  })

  test("rejects discount items with positive amounts", () => {
    const payment = validPayment()
    payment.items = [
      {
        type: "discount",
        id: "discount-1",
        name: "Discount",
        count: 1,
        unit: "1",
        total: "1",
      },
    ]
    const result = ConnectPayment.parse(payment)
    expect(hasValidationErrors(result.issues)).toBe(true)
    expect(result.issues.some((issue) => issue.field === "items[0].unit")).toBe(true)
    expect(result.issues.some((issue) => issue.field === "items[0].total")).toBe(true)
  })

  test("rejects non-object payment payloads", () => {
    const result = ConnectPayment.parse("not-an-object")
    expect(result.value).toBeNull()
    expect(result.issues[0]?.field).toBe("payload")
  })

  test("rejects payments with non-array items", () => {
    const payment = validPayment()
    payment.items = "not-an-array"
    const result = ConnectPayment.parse(payment)
    expect(hasValidationErrors(result.issues)).toBe(true)
    expect(result.issues.some((issue) => issue.field === "items")).toBe(true)
  })

  test("rejects payments with empty outputs", () => {
    const payment = validPayment()
    payment.outputs = []
    const result = ConnectPayment.parse(payment)
    expect(hasValidationErrors(result.issues)).toBe(true)
    expect(result.issues.some((issue) => issue.field === "outputs")).toBe(true)
  })

  test("rejects payments with invalid timeout and max_size", () => {
    const payment = validPayment()
    payment.timeout = 0
    payment.max_size = 0
    const result = ConnectPayment.parse(payment)
    expect(hasValidationErrors(result.issues)).toBe(true)
    expect(result.issues.some((issue) => issue.field === "timeout")).toBe(true)
    expect(result.issues.some((issue) => issue.field === "max_size")).toBe(true)
  })

  test("parses optional fees and taxes when valid", () => {
    const payment = validPayment()
    payment.fees = "0.5"
    payment.taxes = "0.25"
    payment.fiat_total = "12.00"
    payment.fiat_tax = "1.00"
    payment.fiat_currency = "USD"
    const result = ConnectPayment.parse(payment)
    expect(result.value).not.toBeNull()
    expect(hasValidationErrors(result.issues)).toBe(false)
    expect(result.value?.feesKoinu).toBe(50_000_000n)
    expect(result.value?.taxesKoinu).toBe(25_000_000n)
  })
})

const expectFieldValidationError = (
  mutate: (payment: PaymentFixture) => void,
  expectedField: string
) => {
  const payment = validPayment()
  mutate(payment)
  const result = ConnectPayment.parse(payment)
  expect(hasValidationErrors(result.issues)).toBe(true)
  expect(result.issues.some((issue) => issue.field === expectedField)).toBe(true)
}

const validPayment = (): PaymentFixture => ({
  type: "payment",
  id: "pay-1",
  issued: "2025-06-01T00:00:00Z",
  timeout: 60,
  relay: "https://example.com/dc/pay-1",
  fee_per_kb: "0.01",
  max_size: 10000,
  vendor_name: "Test Vendor",
  total: "10",
  items: [],
  outputs: [{ address: OUTPUT_ADDRESS, amount: "10" }],
})

const validItem = (): PaymentFixture => ({
  type: "item",
  id: "item-1",
  name: "Test Item",
  count: 1,
  unit: "10",
  total: "10",
})
