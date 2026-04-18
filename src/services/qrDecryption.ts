// Frontend QR decryption service using tweetnacl
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';

/**
 * Decrypt a base64-encoded NaCl box payload.
 * Format: nonce(24) + ephemeralPubKey(32) + ciphertext
 */
export function decryptQRPayload(base64Payload: string, secretKeyHex: string): any {
  const combined = Buffer.from(base64Payload, 'base64');

  const nonce = new Uint8Array(combined.slice(0, 24));
  const ephemeralPublicKey = new Uint8Array(combined.slice(24, 56));
  const ciphertext = new Uint8Array(combined.slice(56));

  const secretKey = new Uint8Array(Buffer.from(secretKeyHex, 'hex'));

  const decrypted = nacl.box.open(
    ciphertext,
    nonce,
    ephemeralPublicKey,
    secretKey
  );

  if (!decrypted) {
    throw new Error('Decryption failed: invalid key or corrupted data');
  }

  const jsonStr = Buffer.from(decrypted).toString('utf-8');
  return JSON.parse(jsonStr);
}

/**
 * Try to parse QR data — first as base64-encoded JSON (unencrypted/demo),
 * then as raw JSON, return parsed payload or null.
 */
export function tryParseQRData(data: string): any | null {
  // Try base64 → JSON first
  try {
    const decoded = Buffer.from(data, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    if (parsed && (parsed.patientId || parsed.patientAccessId || parsed.qrTokenId)) return parsed;
  } catch { }

  // Try raw JSON
  try {
    const parsed = JSON.parse(data);
    if (parsed && (parsed.patientId || parsed.patientAccessId || parsed.qrTokenId)) return parsed;
  } catch { }

  return null;
}
