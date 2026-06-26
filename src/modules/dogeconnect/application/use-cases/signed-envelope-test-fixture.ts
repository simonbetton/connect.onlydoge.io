import { schnorr } from "@noble/curves/secp256k1.js"
import { sha256 } from "@noble/hashes/sha2.js"
import { bytesToHex, hexToBytesStrict } from "../../domain/shared/encoding"

const PRIVATE_KEY_HEX = "3f6d72f84ec8cc7f4571ec5c9d6f4a9d0b0df6dca1fe2ea9e9876e3f7c2cd541"

export const createSignedEnvelopeFixture = () => {
  const privateKey = hexToBytesStrict(PRIVATE_KEY_HEX)
  if (!privateKey) {
    throw new Error("Failed to decode private key test fixture")
  }

  const payment = {
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
    outputs: [{ address: "DPD7uK4B1kRmbfGmytBhG1DZjaMWNfbpwY", amount: "10" }],
  }

  const payloadText = JSON.stringify(payment)
  const payloadBytes = new TextEncoder().encode(payloadText)
  const firstHash = sha256(payloadBytes)
  const messageHash = sha256(firstHash)
  const publicKey = schnorr.getPublicKey(privateKey)
  const signature = schnorr.sign(messageHash, privateKey)
  const expectedHash = Buffer.from(sha256(publicKey).slice(0, 15)).toString("base64url")

  return {
    expectedHash,
    envelope: {
      version: "1.0",
      payload: Buffer.from(payloadBytes).toString("base64"),
      pubkey: bytesToHex(publicKey),
      sig: bytesToHex(signature),
    },
  }
}

export const createWrongExpectedHash = () =>
  Buffer.from(new Uint8Array(15).fill(255)).toString("base64url")
