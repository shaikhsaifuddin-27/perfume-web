import crypto from 'crypto';

export function generateChallenge(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verifies a signature signed by a WebAuthn private key.
 * @param publicKeyPem Stored public key in PEM format.
 * @param challenge The challenge that was signed.
 * @param signatureHex Signature from the authenticator in hex format.
 * @returns boolean indicating if the signature is valid.
 */
export function verifySignature(publicKeyPem: string, challenge: string, signatureHex: string): boolean {
  try {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(Buffer.from(challenge, 'utf-8'));
    return verifier.verify(publicKeyPem, Buffer.from(signatureHex, 'hex'));
  } catch {
    return false;
  }
}
