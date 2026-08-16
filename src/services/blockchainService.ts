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
  }
}

/**
 * Parses unknown web3 / ethers errors into user-friendly error objects.
 */
export const parseWeb3Error = (error: any): Web3Error => {
  if (!error) {
    return { message: 'An unknown blockchain error occurred', isUserRejection: false };
  }

  // User rejected / cancelled
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
      message: 'Transaction or connection request was rejected in your wallet.',
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
      message: 'Network is not yet added to your wallet.',
      isUserRejection: false,
      raw: error,
    };
  }

  // Standard or custom error message
  const msg = error.reason || error.shortMessage || error.message || 'Blockchain operation failed';
  return {
    code: error.code,
    message: msg.length > 120 ? `${msg.slice(0, 120)}...` : msg,
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
   * Requests connection to the injected EVM wallet (MetaMask, Rabby, Coinbase, etc.)
   */
  public static async connectWallet(): Promise<{
    address: string;
    chainId: number;
    networkName: string;
    isSupported: boolean;
  }> {
    if (!this.isEthereumAvailable()) {
      throw new Error('No EVM wallet detected. Please install MetaMask, Rabby, or a Web3 browser wallet.');
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
        networkName: chainConfig ? chainConfig.name : `Chain ID ${chainId}`,
        isSupported: Boolean(chainConfig),
      };
    } catch (err: any) {
      throw parseWeb3Error(err);
    }
  }

  /**
   * Switches the active network in the connected wallet
   */
  public static async switchNetwork(targetChainId: number): Promise<void> {
    if (!this.isEthereumAvailable()) {
      throw new Error('No EVM wallet detected.');
    }

    const chainConfig = getChainConfig(targetChainId);
    if (!chainConfig) {
      throw new Error(`Chain ID ${targetChainId} is not configured.`);
    }

    const hexChainId = chainConfig.hexId;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      // Code 4902 means the chain hasn't been added to MetaMask/wallet yet
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
   * Queries native and ERC-20 balances for an address on a specified chain
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
      BNB: 0,
      AVAX: 0,
    };

    if (!address || !ethers.isAddress(address)) {
      return balances;
    }

    // Use browser provider or fallback JSON-RPC provider
    const provider: ethers.Provider = this.getBrowserProvider() || this.getFallbackProvider(chainId);

    try {
      // 1. Fetch Native balance according to target chain (POL on Polygon, ETH on Ethereum, BNB on BSC, AVAX on Avalanche)
      try {
        const rawNative = await provider.getBalance(address);
        const formattedNative = Number(parseFloat(formatUnits(rawNative, 18)).toFixed(4));
        if (chainId === 137 || chainId === 80002) {
          balances.MATIC = formattedNative;
        } else if (chainId === 56) {
          balances.BNB = formattedNative;
        } else if (chainId === 43114) {
          balances.AVAX = formattedNative;
        } else {
          balances.ETH = formattedNative;
        }
      } catch (err) {
        console.warn('Native balance query failed:', err);
      }

      // 2. Fetch ERC-20 Token balances
      const tokenSymbols: SupportedToken[] = ['VERSE', 'USDT', 'USDC', 'DAI', 'WBTC', 'ETH', 'MATIC', 'BNB', 'AVAX'];

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

            // Set balance
            balances[symbol] = Number(formatted.toFixed(symbol === 'VERSE' ? 0 : 4));
          } catch {
            // Ignore individual token contract lookup errors on unsupported chains
          }
        })
      );
    } catch (e) {
      console.warn('Balance lookup general error:', e);
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
      (token === 'MATIC' && (chainId === 137 || chainId === 80002)) ||
      (token === 'ETH' && (chainId === 1 || chainId === 11155111));

    const decimals = getTokenDecimals(token);
    const tokenAddress = getTokenAddress(token, chainId);

    // Format raw bigint with safe string rounding to prevent precision errors
    const safeAmountStr = tokenAmount.toFixed(Math.min(decimals, 8));
    const rawAmount = parseUnits(safeAmountStr, decimals);

    // Balance verification
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
      // Fallback gas limit
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
      throw new Error('No EVM wallet detected. Please connect MetaMask, Rabby, or an injected Web3 wallet.');
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
        // ERC-20 Token Transfer (VERSE, USDT, USDC, DAI, etc.)
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
   * Transfers ERC-20 token (such as VERSE) or native currency
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
