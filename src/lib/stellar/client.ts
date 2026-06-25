import StellarSdk, { Keypair, Networks } from 'stellar-sdk';
import { STELLAR_BLOG_SECRET_KEY, STELLAR_NETWORK, STELLAR_HORIZON_URL } from './config';

export function getStellarServer() {
  return new StellarSdk.Horizon.Server(STELLAR_HORIZON_URL);
}

export function getNetworkPassphrase() {
  return STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
}

export function getBlogKeypair() {
  if (!STELLAR_BLOG_SECRET_KEY) throw new Error('Missing STELLAR_BLOG_SECRET_KEY');
  return Keypair.fromSecret(STELLAR_BLOG_SECRET_KEY);
}
