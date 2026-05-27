import { randomBytes } from 'node:crypto';
import { Keypair, StrKey } from '@stellar/stellar-sdk';
import { describe, expect, it } from 'vitest';
import { isValidAccountId, isValidContractId } from '@/lib/stellar/strkey';

/**
 * Cross-checks the hand-rolled StrKey validator against the canonical
 * `@stellar/stellar-sdk` encoders: anything the SDK produces must validate,
 * and tampered/short/wrong-prefix values must not.
 */
describe('isValidAccountId', () => {
  it('accepts SDK-generated account ids', () => {
    for (let i = 0; i < 25; i++) {
      expect(isValidAccountId(Keypair.random().publicKey())).toBe(true);
    }
  });

  it('rejects a tampered checksum', () => {
    const valid = Keypair.random().publicKey();
    // Flip one base32 char in the middle — shape stays valid, checksum breaks.
    const ch = valid[30] === 'A' ? 'B' : 'A';
    const tampered = valid.slice(0, 30) + ch + valid.slice(31);
    expect(tampered).toHaveLength(56);
    expect(isValidAccountId(tampered)).toBe(false);
  });

  it('rejects contract ids and malformed input', () => {
    expect(isValidAccountId(StrKey.encodeContract(randomBytes(32)))).toBe(false);
    expect(isValidAccountId('GABC')).toBe(false);
    expect(isValidAccountId('not-a-key')).toBe(false);
    expect(isValidAccountId('')).toBe(false);
  });
});

describe('isValidContractId', () => {
  it('accepts SDK-generated contract ids', () => {
    for (let i = 0; i < 10; i++) {
      expect(isValidContractId(StrKey.encodeContract(randomBytes(32)))).toBe(true);
    }
  });

  it('rejects account ids and tampered contracts', () => {
    expect(isValidContractId(Keypair.random().publicKey())).toBe(false);
    const valid = StrKey.encodeContract(randomBytes(32));
    const ch = valid[30] === 'A' ? 'B' : 'A';
    expect(isValidContractId(valid.slice(0, 30) + ch + valid.slice(31))).toBe(false);
  });
});
