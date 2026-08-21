import {
  CredentialVerifyPageContent,
  credentialVerifyMetadata,
} from '@/components/modules/credentials';

// Always re-checks status on-chain: a credential can be revoked at any time,
// and this page's whole purpose is to reflect that immediately.
export const revalidate = 0;

export const generateMetadata = credentialVerifyMetadata;

export default CredentialVerifyPageContent;
