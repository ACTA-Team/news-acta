/**
 * Stellar StrKey validation — hand-rolled, pure and dependency-free.
 *
 * StrKeys are base32 (RFC 4648 alphabet) encodings of:
 *   [ 1-byte version ][ payload ][ 2-byte CRC16-XModem checksum ]
 *
 * Validating the checksum (not just the shape) is what lets the parser reject
 * random `G…`/`C…`-looking strings instead of resolving garbage. Kept free of
 * `@stellar/stellar-sdk` so it stays usable in the client-side admin modal
 * without pulling the SDK into the browser bundle.
 *
 * Version bytes (high 5 bits): ed25519 public key = 6 (`G`), contract = 2 (`C`).
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const VERSION_BYTE = {
  ed25519PublicKey: 6 << 3, // 0x30 → 'G'
  contract: 2 << 3, // 0x10 → 'C'
} as const;

/** Decode RFC 4648 base32 (no padding) into bytes, or null if malformed. */
function base32Decode(input: string): Uint8Array | null {
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of input) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) return null;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((value >>> bits) & 0xff);
    }
  }
  return Uint8Array.from(output);
}

/** CRC16-XModem (poly 0x1021, init 0x0000) — the checksum Stellar StrKeys use. */
function crc16xmodem(bytes: Uint8Array): number {
  let crc = 0x0000;
  for (const byte of bytes) {
    let code = (crc >>> 8) & 0xff;
    code ^= byte & 0xff;
    code ^= code >>> 4;
    crc = (crc << 8) & 0xffff;
    crc ^= code;
    code = (code << 5) & 0xffff;
    crc ^= code;
    code = (code << 7) & 0xffff;
    crc ^= code;
  }
  return crc & 0xffff;
}

/** Validate a StrKey of the given version byte, including its CRC16 checksum. */
function isValidStrKey(value: string, expectedVersion: number): boolean {
  // StrKeys are 56 chars (1 version + 32 payload + 2 crc = 35 bytes → 56 base32).
  if (value.length !== 56) return false;

  const decoded = base32Decode(value);
  if (!decoded || decoded.length !== 35) return false;

  if (decoded[0] !== expectedVersion) return false;

  const payload = decoded.subarray(0, decoded.length - 2);
  const checksum = decoded[decoded.length - 2] | (decoded[decoded.length - 1] << 8);

  return crc16xmodem(payload) === checksum;
}

/** True for a valid ed25519 account address (`G…`, checksum verified). */
export function isValidAccountId(value: string): boolean {
  return value.startsWith('G') && isValidStrKey(value, VERSION_BYTE.ed25519PublicKey);
}

/** True for a valid Soroban contract id (`C…`, checksum verified). */
export function isValidContractId(value: string): boolean {
  return value.startsWith('C') && isValidStrKey(value, VERSION_BYTE.contract);
}
