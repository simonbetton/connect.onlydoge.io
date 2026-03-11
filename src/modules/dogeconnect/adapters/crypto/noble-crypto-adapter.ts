import { schnorr } from "@noble/curves/secp256k1.js"
import { sha256 } from "@noble/hashes/sha2.js"
import type { CryptoPort } from "../../ports/crypto-port"

export class NobleCryptoAdapter implements CryptoPort {
  sha256(data: Uint8Array): Uint8Array {
    return sha256(data)
  }

  deriveSchnorrPublicKey(privateKey: Uint8Array): Uint8Array {
    return schnorr.getPublicKey(privateKey)
  }

  signSchnorr(messageHash: Uint8Array, privateKey: Uint8Array): Uint8Array {
    return schnorr.sign(messageHash, privateKey)
  }

  verifySchnorr(
    signature: Uint8Array,
    messageHash: Uint8Array,
    xOnlyPublicKey: Uint8Array
  ): boolean {
    try {
      return schnorr.verify(signature, messageHash, xOnlyPublicKey)
    } catch {
      return false
    }
  }
}
