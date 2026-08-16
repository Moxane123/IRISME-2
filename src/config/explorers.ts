import { SUPPORTED_CHAINS } from './chains';

export const getExplorerTxUrl = (arg1: string | number, arg2?: string | number): string => {
  let txHash = '';
  let chainId = 137;

  if (typeof arg1 === 'number') {
    chainId = arg1;
    txHash = String(arg2 || '');
  } else {
    txHash = arg1;
    if (typeof arg2 === 'number') {
      chainId = arg2;
    }
  }

  if (!txHash) return '#';
  const chain = SUPPORTED_CHAINS[chainId] || SUPPORTED_CHAINS[137];
  const baseUrl = chain.blockExplorerUrls[0] || 'https://polygonscan.com';
  return `${baseUrl}/tx/${txHash}`;
};

export const getExplorerAddressUrl = (arg1: string | number, arg2?: string | number): string => {
  let address = '';
  let chainId = 137;

  if (typeof arg1 === 'number') {
    chainId = arg1;
    address = String(arg2 || '');
  } else {
    address = arg1;
    if (typeof arg2 === 'number') {
      chainId = arg2;
    }
  }

  if (!address) return '#';
  const chain = SUPPORTED_CHAINS[chainId] || SUPPORTED_CHAINS[137];
  const baseUrl = chain.blockExplorerUrls[0] || 'https://polygonscan.com';
  return `${baseUrl}/address/${address}`;
};

export const getExplorerTokenUrl = (tokenAddress: string, chainId: number = 137): string => {
  if (!tokenAddress) return '#';
  const chain = SUPPORTED_CHAINS[chainId] || SUPPORTED_CHAINS[137];
  const baseUrl = chain.blockExplorerUrls[0] || 'https://polygonscan.com';
  return `${baseUrl}/token/${tokenAddress}`;
};
