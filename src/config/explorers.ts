import { SUPPORTED_CHAINS } from './chains';
import { MULTI_CHAIN_TOKEN_CONFIGS } from './multiChainTokens';

/**
 * Universal Multi-Chain Explorer URL Resolver
 * Supports EVM Chain IDs (1, 137, 56) and Named Multi-Chain Networks (Solana, Tron, Bitcoin, BNB Smart Chain, Polygon, Ethereum)
 */
export const getExplorerTxUrl = (
  arg1: string | number,
  arg2?: string | number,
  networkName?: string
): string => {
  let txHash = '';
  let chainId = 137;
  let targetNetwork = networkName || '';

  if (typeof arg1 === 'number') {
    chainId = arg1;
    txHash = String(arg2 || '');
  } else {
    txHash = arg1;
    if (typeof arg2 === 'number') {
      chainId = arg2;
    } else if (typeof arg2 === 'string' && !networkName) {
      targetNetwork = arg2;
    }
  }

  if (!txHash) return '#';

  // Check if explicit network name provided or discernible
  if (targetNetwork) {
    const netLower = targetNetwork.toLowerCase();
    if (netLower.includes('solana')) {
      return `https://solscan.io/tx/${txHash}`;
    }
    if (netLower.includes('tron')) {
      return `https://tronscan.org/#/transaction/${txHash.replace(/^0x/, '')}`;
    }
    if (netLower.includes('bitcoin') || netLower.includes('btc')) {
      return `https://mempool.space/tx/${txHash.replace(/^0x/, '')}`;
    }
    if (netLower.includes('bnb') || netLower.includes('bsc') || netLower.includes('binance')) {
      return `https://bscscan.com/tx/${txHash}`;
    }
    if (netLower.includes('ethereum') || netLower.includes('mainnet')) {
      return `https://etherscan.io/tx/${txHash}`;
    }
    if (netLower.includes('polygon') || netLower.includes('matic') || netLower.includes('pol')) {
      return `https://polygonscan.com/tx/${txHash}`;
    }
  }

  // Detect based on hash format
  if (!txHash.startsWith('0x')) {
    if (txHash.length >= 80) {
      // Solana signature
      return `https://solscan.io/tx/${txHash}`;
    }
    if (txHash.length === 64) {
      // Could be Bitcoin TxID or Tron TxID
      if (chainId === 56) return `https://bscscan.com/tx/0x${txHash}`;
      return `https://mempool.space/tx/${txHash}`;
    }
  }

  // EVM Chain resolution
  if (chainId === 56) {
    return `https://bscscan.com/tx/${txHash}`;
  }
  if (chainId === 1) {
    return `https://etherscan.io/tx/${txHash}`;
  }

  const chain = SUPPORTED_CHAINS[chainId] || SUPPORTED_CHAINS[137];
  const baseUrl = chain?.blockExplorerUrls?.[0] || 'https://polygonscan.com';
  return `${baseUrl}/tx/${txHash}`;
};

export const getExplorerAddressUrl = (
  arg1: string | number,
  arg2?: string | number,
  networkName?: string
): string => {
  let address = '';
  let chainId = 137;
  let targetNetwork = networkName || '';

  if (typeof arg1 === 'number') {
    chainId = arg1;
    address = String(arg2 || '');
  } else {
    address = arg1;
    if (typeof arg2 === 'number') {
      chainId = arg2;
    } else if (typeof arg2 === 'string' && !networkName) {
      targetNetwork = arg2;
    }
  }

  if (!address) return '#';

  if (targetNetwork) {
    const netLower = targetNetwork.toLowerCase();
    if (netLower.includes('solana')) {
      return `https://solscan.io/account/${address}`;
    }
    if (netLower.includes('tron')) {
      return `https://tronscan.org/#/address/${address}`;
    }
    if (netLower.includes('bitcoin') || netLower.includes('btc')) {
      return `https://mempool.space/address/${address}`;
    }
    if (netLower.includes('bnb') || netLower.includes('bsc')) {
      return `https://bscscan.com/address/${address}`;
    }
    if (netLower.includes('ethereum')) {
      return `https://etherscan.io/address/${address}`;
    }
    if (netLower.includes('polygon')) {
      return `https://polygonscan.com/address/${address}`;
    }
  }

  // Detect based on address format
  if (address.startsWith('T') && address.length === 34) {
    return `https://tronscan.org/#/address/${address}`;
  }
  if (address.startsWith('bc1') || address.startsWith('1') || address.startsWith('3')) {
    return `https://mempool.space/address/${address}`;
  }
  if (!address.startsWith('0x') && address.length >= 32 && address.length <= 44) {
    return `https://solscan.io/account/${address}`;
  }

  if (chainId === 56) {
    return `https://bscscan.com/address/${address}`;
  }
  if (chainId === 1) {
    return `https://etherscan.io/address/${address}`;
  }

  const chain = SUPPORTED_CHAINS[chainId] || SUPPORTED_CHAINS[137];
  const baseUrl = chain?.blockExplorerUrls?.[0] || 'https://polygonscan.com';
  return `${baseUrl}/address/${address}`;
};

export const getExplorerTokenUrl = (tokenAddress: string, chainId: number = 137): string => {
  if (!tokenAddress) return '#';
  const chain = SUPPORTED_CHAINS[chainId] || SUPPORTED_CHAINS[137];
  const baseUrl = chain.blockExplorerUrls[0] || 'https://polygonscan.com';
  return `${baseUrl}/token/${tokenAddress}`;
};

