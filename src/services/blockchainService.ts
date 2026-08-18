import { ethers, Contract, formatUnits, parseUnits } from 'ethers';
import {
  SUPPORTED_CHAINS,
  DEFAULT_CHAIN_ID,
  ChainConfig,
  getChainConfig,
  TOKEN_CONFIGS,
  ERC20_ABI,
  getTokenAddress,
  getTokenDecimals,
} from '../config';
import { SupportedToken } from '../types';
import {
  TxLifecycleStatus,
  Web3Error,
  PreparedTransaction,
  SubmittedTransactionReceipt,
  WalletBalances,
} from '../types/web3';

declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
    phantom?: any;
  }
}

/**
 * Parses unknown web3 / ethers errors into user-friendly error objects.
 */
export const parseWeb3Error = (error: any): Web3Error => {
  if (!error) {
    return { message: 'An unknown blockchain error occurred', isUserRejection: false };
  }

  // User rejected / cancelled in wallet extension
  if (
    error.code === 4001 ||
    error.code === 'ACTION_REJECTED' ||
    error.message?.includes('user rejected') ||
    error.message?.includes('User rejected') ||
    error.message?.includes('User denied') ||
    error.info?.error?.code === 4001
  ) {
    return {
      code: 4001,
      message: 'Transaction or connection authorization was rejected in your wallet.',
      isUserRejection: true,
      raw: error,
    };
  }

  // Request already pending in extension
  if (error.code === -32002 || error.message?.includes('already pending')) {
    return {
      code: -32002,
      message: 'A wallet request is already pending. Please open your wallet extension to review it.',
      isUserRejection: false,
      raw: error,
    };
  }

  // Insufficient funds for gas or value
  if (
    error.code === 'INSUFFICIENT_FUNDS' ||
    error.message?.includes('insufficient funds') ||
    error.message?.includes('exceeds balance')
  ) {
    return {
      code: 'INSUFFICIENT_FUNDS',
      message: 'Insufficient funds in your connected wallet for this payment or network gas fees.',
      isUserRejection: false,
      raw: error,
    };
  }

  // Unrecognized chain
  if (error.code === 4902) {
    return {
      code: 4902,
      message: 'Network is not yet added to your wallet. Please approve adding the network.',
      isUserRejection: false,
      raw: error,
    };
  }

  // Standard or custom error message
  const msg = error.reason || error.shortMessage || error.message || 'Blockchain operation failed';
  return {
    code: error.code,
    message: msg.length > 140 ? `${msg.slice(0, 140)}...` : msg,
    isUserRejection: false,
    raw: error,
  };
};

export class BlockchainService {
  /**
   * Checks if an EIP-1193 EVM wallet is available in the browser window
   */
  public static isEthereumAvailable(): boolean {
    return typeof window !== 'undefined' && Boolean(window.ethereum);
  }

  /**
   * Returns a browser provider if available
   */
  public static getBrowserProvider(): ethers.BrowserProvider | null {
    if (!this.isEthereumAvailable()) return null;
    try {
      return new ethers.BrowserProvider(window.ethereum, 'any');
    } catch (e) {
      console.warn('Failed to initialize browser provider:', e);
      return null;
    }
  }

  /**
   * Returns a fallback RPC provider for reading data without a connected wallet
   */
  public static getFallbackProvider(chainId: number = DEFAULT_CHAIN_ID): ethers.JsonRpcProvider {
    const chain = getChainConfig(chainId) || SUPPORTED_CHAINS[DEFAULT_CHAIN_ID];
    const rpcUrl = chain.rpcUrls[0];
    return new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Requests connection to the injected EVM wallet (MetaMask, Rabby, Coinbase, Verse, etc.)
   */
  public static async connectWallet(): Promise<{
    address: string;
    chainId: number;
    networkName: string;
    isSupported: boolean;
  }> {
    if (!this.isEthereumAvailable()) {
      throw new Error('No Web3 wallet detected. Please install MetaMask, Rabby, Coinbase Wallet, or Verse.');
    }

    const provider = this.getBrowserProvider();
    if (!provider) {
      throw new Error('Could not access Web3 provider');
    }

    try {
      // EIP-1102 / EIP-1193 account request
      const accounts: string[] = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts selected in wallet');
      }

      const rawAddress = accounts[0];
      const address = ethers.getAddress(rawAddress);

      // Detect network
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const chainConfig = getChainConfig(chainId);

      return {
        address,
        chainId,
        networkName: chainConfig?.name || `Chain ${chainId}`,
        isSupported: Boolean(chainConfig),
      };
    } catch (error: any) {
      throw parseWeb3Error(error);
    }
  }

  /**
   * Switches the active network in the injected wallet (EIP-3326)
   */
  public static async switchNetwork(targetChainId: number): Promise<void> {
    if (!this.isEthereumAvailable()) {
      throw new Error('Web3 wallet is not available');
    }

    const chainConfig = getChainConfig(targetChainId);
    if (!chainConfig) {
      throw new Error(`Chain ID ${targetChainId} is not supported`);
    }

    const hexChainId = chainConfig.hexId || `0x${targetChainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      // Error code 4902 means the chain has not been added to the wallet yet
      if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId,
                chainName: chainConfig.name,
                nativeCurrency: chainConfig.nativeCurrency,
                rpcUrls: chainConfig.rpcUrls,
                blockExplorerUrls: chainConfig.blockExplorerUrls,
              },
            ],
          });
        } catch (addError: any) {
          throw parseWeb3Error(addError);
        }
      } else {
        throw parseWeb3Error(switchError);
      }
    }
  }

  /**
   * Queries real on-chain native and token balances for an address on a specified chain.
   * Uses live RPC and verified contract calls. No mock data.
   */
  public static async fetchBalances(
    address: string,
    chainId: number = DEFAULT_CHAIN_ID
  ): Promise<WalletBalances> {
    const balances: WalletBalances = {
      VERSE: 0,
      USDT: 0,
      USDC: 0,
      DAI: 0,
      ETH: 0,
      WBTC: 0,
      MATIC: 0,
      POL: 0,
      BNB: 0,
      AVAX: 0,
      SOL: 0,
      BTC: 0,
      TRX: 0,
    };

    if (!address || !ethers.isAddress(address)) {
      return balances;
    }

    const provider: ethers.Provider = this.getBrowserProvider() || this.getFallbackProvider(chainId);

    try {
      // 1. Fetch Real Native Balance on active chain
      try {
        const rawNative = await provider.getBalance(address);
        const formattedNative = parseFloat(formatUnits(rawNative, 18));
        const cleanNative = Number(formattedNative.toFixed(6));

        if (chainId === 137) {
          balances.POL = cleanNative;
          balances.MATIC = cleanNative;
        } else if (chainId === 1 || chainId === 8453 || chainId === 42161) {
          balances.ETH = cleanNative;
        } else if (chainId === 56) {
          balances.BNB = cleanNative;
        } else if (chainId === 43114) {
          balances.AVAX = cleanNative;
        }
      } catch (err) {
        console.warn('Native balance live query error:', err);
      }

      // 2. Fetch Real ERC-20 / BEP-20 Token Balances on active chain
      const tokenSymbols: SupportedToken[] = ['USDT', 'USDC', 'VERSE', 'WBTC', 'DAI', 'ETH', 'POL', 'BNB', 'AVAX'];

      await Promise.allSettled(
        tokenSymbols.map(async (symbol) => {
          const config = TOKEN_CONFIGS[symbol];
          const tokenAddress = getTokenAddress(symbol, chainId);

          if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
            return;
          }

          try {
            const contract = new Contract(tokenAddress, ERC20_ABI, provider);
            const rawBalance: bigint = await contract.balanceOf(address);
            const decimals = config?.decimals || 18;
            const formatted = parseFloat(formatUnits(rawBalance, decimals));

            if (formatted > 0) {
              balances[symbol] = Number(formatted.toFixed(symbol === 'VERSE' ? 2 : 6));
            }
          } catch (tokenErr) {
            // Token contract lookup error
          }
        })
      );

      // 3. Scan other EVM chains in parallel if needed to give user a complete portfolio view
      try {
        const otherChainIds = [137, 1, 8453, 42161, 56, 43114].filter((id) => id !== chainId);
        await Promise.allSettled(
          otherChainIds.map(async (otherId) => {
            const otherProvider = this.getFallbackProvider(otherId);
            // Query native gas asset if not already filled
            if (otherId === 137 && balances.POL === 0) {
              const b = await otherProvider.getBalance(address);
              const val = Number(parseFloat(formatUnits(b, 18)).toFixed(6));
              if (val > 0) {
                balances.POL = val;
                balances.MATIC = val;
              }
            } else if (otherId === 1 && balances.ETH === 0) {
              const b = await otherProvider.getBalance(address);
              const val = Number(parseFloat(formatUnits(b, 18)).toFixed(6));
              if (val > 0) balances.ETH = val;
            } else if (otherId === 56 && balances.BNB === 0) {
              const b = await otherProvider.getBalance(address);
              const val = Number(parseFloat(formatUnits(b, 18)).toFixed(6));
              if (val > 0) balances.BNB = val;
            } else if (otherId === 43114 && balances.AVAX === 0) {
              const b = await otherProvider.getBalance(address);
              const val = Number(parseFloat(formatUnits(b, 18)).toFixed(6));
              if (val > 0) balances.AVAX = val;
            }

            // Query USDT & USDC on other chains if currently 0
            for (const sym of ['USDT', 'USDC', 'VERSE', 'WBTC'] as SupportedToken[]) {
              if (balances[sym] === 0) {
                const tAddr = getTokenAddress(sym, otherId);
                if (tAddr && ethers.isAddress(tAddr)) {
                  const contract = new Contract(tAddr, ERC20_ABI, otherProvider);
                  const raw = await contract.balanceOf(address);
                  const dec = getTokenDecimals(sym);
                  const fmt = parseFloat(formatUnits(raw, dec));
                  if (fmt > 0) {
                    balances[sym] = Number(fmt.toFixed(sym === 'VERSE' ? 2 : 4));
                  }
                }
              }
            }
          })
        );
      } catch {}
    } catch (e) {
      console.warn('Real on-chain balance query error:', e);
    }

    return balances;
  }

  /**
   * Prepares and validates a payment transaction before wallet submission
   */
  public static async preparePayment(params: {
    fromAddress: string;
    merchantSettlementAddress: string;
    token: SupportedToken;
    tokenAmount: number;
    chainId: number;
  }): Promise<PreparedTransaction> {
    const { fromAddress, merchantSettlementAddress, token, tokenAmount, chainId } = params;

    if (!ethers.isAddress(fromAddress)) {
      throw new Error('Invalid customer wallet address');
    }
    if (!ethers.isAddress(merchantSettlementAddress)) {
      throw new Error('Invalid merchant settlement address');
    }

    const tokenConfig = TOKEN_CONFIGS[token];
    const isNative =
      (token === 'POL' && chainId === 137) ||
      (token === 'MATIC' && chainId === 137) ||
      (token === 'ETH' && (chainId === 1 || chainId === 8453 || chainId === 42161)) ||
      (token === 'BNB' && chainId === 56) ||
      (token === 'AVAX' && chainId === 43114);

    const decimals = getTokenDecimals(token);
    const tokenAddress = getTokenAddress(token, chainId);

    // Format raw bigint with safe string rounding to prevent precision errors
    const safeAmountStr = tokenAmount.toFixed(Math.min(decimals, 8));
    const rawAmount = parseUnits(safeAmountStr, decimals);

    // Live balance verification
    const currentBalances = await this.fetchBalances(fromAddress, chainId);
    const userBalance = currentBalances[token] || 0;
    const hasSufficientBalance = userBalance >= tokenAmount;

    let estimatedGasLimit: bigint | undefined;
    let maxFeePerGas: bigint | undefined;
    let maxPriorityFeePerGas: bigint | undefined;

    try {
      const provider = this.getBrowserProvider() || this.getFallbackProvider(chainId);
      const feeData = await provider.getFeeData();
      maxFeePerGas = feeData.maxFeePerGas || undefined;
      maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || undefined;

      if (isNative) {
        estimatedGasLimit = await provider.estimateGas({
          from: fromAddress,
          to: merchantSettlementAddress,
          value: rawAmount,
        });
      } else if (tokenAddress) {
        const contract = new Contract(tokenAddress, ERC20_ABI, provider);
        estimatedGasLimit = await contract.transfer.estimateGas(merchantSettlementAddress, rawAmount, {
          from: fromAddress,
        });
      }
    } catch (gasErr) {
      estimatedGasLimit = isNative ? 21000n : 65000n;
    }

    return {
      token,
      tokenAddress,
      isNative,
      to: merchantSettlementAddress,
      formattedAmount: safeAmountStr,
      rawAmount,
      decimals,
      estimatedGasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      userBalance,
      hasSufficientBalance,
    };
  }

  /**
   * Submits the transaction to the EVM blockchain via the user's self-custodial wallet
   */
  public static async submitPayment(
    prepared: PreparedTransaction,
    onStatusChange?: (status: TxLifecycleStatus, txHash?: string) => void
  ): Promise<SubmittedTransactionReceipt> {
    if (!this.isEthereumAvailable()) {
      throw new Error('No Web3 wallet detected. Please connect MetaMask, Rabby, Coinbase Wallet, or Verse.');
    }

    const provider = this.getBrowserProvider();
    if (!provider) {
      throw new Error('Could not access Web3 provider');
    }

    const signer = await provider.getSigner();
    const network = await provider.getNetwork();
    const currentChainId = Number(network.chainId);

    onStatusChange?.('awaiting_signature');

    try {
      let txResponse: ethers.TransactionResponse;

      if (prepared.isNative) {
        // Native POL/ETH direct transfer to merchant settlement address
        txResponse = await signer.sendTransaction({
          to: prepared.to,
          value: prepared.rawAmount,
          gasLimit: prepared.estimatedGasLimit ? (prepared.estimatedGasLimit * 12n) / 10n : undefined,
        });
      } else {
        // ERC-20 Token Transfer (USDT, USDC, VERSE, DAI, WBTC, etc.)
        if (!prepared.tokenAddress) {
          throw new Error(`Token contract for ${prepared.token} is not configured on chain ${currentChainId}.`);
        }

        const tokenContract = new Contract(prepared.tokenAddress, ERC20_ABI, signer);
        txResponse = await tokenContract.transfer(prepared.to, prepared.rawAmount, {
          gasLimit: prepared.estimatedGasLimit ? (prepared.estimatedGasLimit * 12n) / 10n : undefined,
        });
      }

      const txHash = txResponse.hash;
      onStatusChange?.('submitted', txHash);

      // Transition to confirming state - polling for on-chain inclusion
      onStatusChange?.('confirming', txHash);

      // Await 1 block confirmation on-chain
      const receipt = await txResponse.wait(1);

      if (!receipt) {
        throw new Error('Transaction receipt was empty or dropped by RPC node.');
      }

      if (receipt.status === 0) {
        onStatusChange?.('failed', txHash);
        throw new Error('Transaction reverted on-chain. Please check gas or token allowance.');
      }

      onStatusChange?.('confirmed', txHash);

      return {
        txHash,
        blockNumber: receipt.blockNumber,
        confirmations: 1,
        from: receipt.from,
        to: receipt.to || prepared.to,
        gasUsed: receipt.gasUsed.toString(),
        status: 'confirmed',
        chainId: currentChainId,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      const parsed = parseWeb3Error(err);
      onStatusChange?.('failed');
      throw parsed;
    }
  }

  /**
   * Transfers ERC-20 token (such as VERSE, USDT, USDC) or native currency
   */
  public static async transferToken(params: {
    tokenSymbol: SupportedToken;
    toAddress: string;
    amount: number;
    chainId?: number;
  }): Promise<SubmittedTransactionReceipt> {
    const chainId = params.chainId || DEFAULT_CHAIN_ID;
    const provider = this.getBrowserProvider();
    if (!provider) {
      throw new Error('No browser Web3 wallet connected');
    }
    const signer = await provider.getSigner();
    const fromAddress = await signer.getAddress();

    const prepared = await this.preparePayment({
      fromAddress,
      merchantSettlementAddress: params.toAddress,
      token: params.tokenSymbol,
      tokenAmount: params.amount,
      chainId,
    });

    return this.submitPayment(prepared);
  }
}
