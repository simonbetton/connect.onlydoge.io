export interface CryptoPort {
  sha256(data: Uint8Array): Uint8Array
  deriveSchnorrPublicKey(privateKey: Uint8Array): Uint8Array
  signSchnorr(messageHash: Uint8Array, privateKey: Uint8Array): Uint8Array
  verifySchnorr(signature: Uint8Array, messageHash: Uint8Array, xOnlyPublicKey: Uint8Array): boolean
}
