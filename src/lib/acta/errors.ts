import 'server-only';

import { ActaApiError, normalizeError } from '@acta-team/credentials';

/** ACTA's own code for "the vault already exists" (safe to treat as success). */
const VAULT_ALREADY_EXISTS_CODE = 'vault_already_exists';

export function isVaultAlreadyExistsError(err: unknown): boolean {
  const normalized = toActaApiError(err);
  return normalized.status === 409 || normalized.code === VAULT_ALREADY_EXISTS_CODE;
}

export function toActaApiError(err: unknown): ActaApiError {
  return err instanceof ActaApiError ? err : normalizeError(err);
}
