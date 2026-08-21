export { getActaClient, getActaNetwork } from './client';
export { createServerSigner } from './signer';
export { SupabaseIssuerIdentityStorage } from './identity-storage';
export { createAuthorIdentity, getAuthorIdentity } from './identity';
export {
  issueAuthorCredential,
  revokeAuthorCredential,
  verifyAuthorCredential,
  type IssueAuthorCredentialInput,
} from './credentials';
export { isVaultAlreadyExistsError, toActaApiError } from './errors';
