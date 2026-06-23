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
  ])("reports validation errors for $name", ({ mutate, expectedField }) => {
    const payment = validPayment()
    mutate(payment)

    const result = ConnectPayment.parse(payment)

    expect(hasValidationErrors(result.issues)).toBe(true)
    expect(result.issues.some((issue) => issue.field === expectedField)).toBe(true)
  })

  test("rejects an invalid payment type", () => {
    const payment = validPayment()
    payment.type = "invoice"

    const result = ConnectPayment.parse(payment)

    expect(hasValidationErrors(result.issues)).toBe(true)
    expect(result.issues.some((issue) => issue.field === "type")).toBe(true)
  })

  test("rejects an invalid item type", () => {
    const payment = validPayment()
    payment.items = [{ ...validItem(), type: "unsupported" }]

    const result = ConnectPayment.parse(payment)

    expect(hasValidationErrors(result.issues)).toBe(true)
    expect(result.issues.some((issue) => issue.field === "items[0].type")).toBe(true)
  })

  test("reports malformed output amounts", () => {
    const payment = validPayment()
    payment.outputs = [{ address: OUTPUT_ADDRESS, amount: "not-a-number" }]

    const result = ConnectPayment.parse(payment)

    expect(hasValidationErrors(result.issues)).toBe(true)
    expect(result.issues.some((issue) => issue.field === "outputs[0].amount")).toBe(true)
  })

  test("reports invalid relay URLs", () => {
    const payment = validPayment()
    payment.relay = "http://example.com/dc/pay-1"

    const result = ConnectPayment.parse(payment)

    expect(hasValidationErrors(result.issues)).toBe(true)
    expect(result.issues.some((issue) => issue.field === "relay")).toBe(true)
  })
})

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
