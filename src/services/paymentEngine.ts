import { ethers } from 'ethers';
import {
  PaymentEngineState,
  PaymentValidationResult,
  GasEstimationResult,
  SupportedToken,
} from '../types';
import { getChainConfig, isTokenConfiguredOnChain, getTokenAddress } from '../config';

export interface PaymentEngineContext {
  isWalletConnected: boolean;
  walletAddress?: string;
  walletChainId?: number;
  targetChainId: number;
  selectedToken: SupportedToken;
  tokenAmount: number;
  merchantAddress: string;
  userTokenBalance: number;
  userNativeGasBalance: number;
  gasEstimate?: GasEstimationResult;
  isExpired?: boolean;
}

export class PaymentEngine {
  /**
   * Validates a multi-chain payment request against all 7 strict payment rules:
   * 1. Wallet Connection Rule: Checks wallet presence and authorization
   * 2. Target Network Alignment Rule: Ensures connected chain matches invoice chain
   * 3. Merchant Settlement Address Rule: Verifies valid recipient address
   * 4. Token Contract Availability Rule: Ensures token is configured on target chain
   * 5. Real Token Balance Rule: Ensures connected wallet has sufficient real funds
   * 6. Real Gas Balance Rule: Ensures connected wallet has native gas (POL, ETH, BNB, AVAX) for network fee
   * 7. Expiration Rule: Ensures invoice is still within validity window
   */
  public static validatePayment(context: PaymentEngineContext): PaymentValidationResult {
    const {
      isWalletConnected,
      walletChainId,
      targetChainId,
      selectedToken,
      tokenAmount,
      merchantAddress,
      userTokenBalance,
      userNativeGasBalance,
      gasEstimate,
      isExpired,
    } = context;

    const targetChain = getChainConfig(targetChainId);
    const targetNetworkName = targetChain?.name || `Chain ID ${targetChainId}`;
    const nativeGasToken = targetChain?.nativeCurrency.symbol || 'GAS';

    const currentChain = walletChainId ? getChainConfig(walletChainId) : undefined;
    const currentNetworkName = currentChain?.name || (walletChainId ? `Chain ID ${walletChainId}` : undefined);

    const isValidAmount = tokenAmount > 0;
    const isValidMerchantAddress = Boolean(merchantAddress && ethers.isAddress(merchantAddress));

    // Rule 7: Expiration Check
    if (isExpired) {
      return {
        isValid: false,
        state: 'Failed',
        isWalletConnected,
        isCorrectNetwork: walletChainId === targetChainId,
        currentChainId: walletChainId,
        currentNetworkName,
        targetChainId,
        targetNetworkName,
        hasTokenBalance: false,
        userTokenBalance,
        requiredTokenAmount: tokenAmount,
        tokenSymbol: selectedToken,
        hasGasBalance: false,
        userGasBalance: userNativeGasBalance,
        estimatedGasCost: 0,
        nativeGasToken,
        isValidMerchantAddress,
        isValidAmount,
        statusMessage: 'Invoice Expired',
        detailedExplanation: 'This payment request has passed its expiration time. Please request a new invoice from the merchant.',
      };
    }

    // Rule 1: Wallet Connection Rule
    if (!isWalletConnected) {
      return {
        isValid: false,
        state: 'Ready',
        isWalletConnected: false,
        isCorrectNetwork: false,
        currentChainId: walletChainId,
        currentNetworkName,
        targetChainId,
        targetNetworkName,
        hasTokenBalance: false,
        userTokenBalance,
        requiredTokenAmount: tokenAmount,
        tokenSymbol: selectedToken,
        hasGasBalance: false,
        userGasBalance: userNativeGasBalance,
        estimatedGasCost: gasEstimate?.estimatedNativeGasCost || 0,
        nativeGasToken,
        isValidMerchantAddress,
        isValidAmount,
        statusMessage: 'Connect your Web3 wallet to review real balances and pay.',
      };
    }

    // Rule 2: Wrong Network Detection & Alignment Rule
    const isCorrectNetwork = walletChainId === targetChainId;
    if (!isCorrectNetwork) {
      const fromChainName = currentNetworkName || `Chain ID ${walletChainId}`;
      const toChainName = targetNetworkName;
      return {
        isValid: false,
        state: 'Wrong network',
        isWalletConnected: true,
        isCorrectNetwork: false,
        currentChainId: walletChainId,
        currentNetworkName,
        targetChainId,
        targetNetworkName,
        hasTokenBalance: false,
        userTokenBalance,
        requiredTokenAmount: tokenAmount,
        tokenSymbol: selectedToken,
        hasGasBalance: false,
        userGasBalance: userNativeGasBalance,
        estimatedGasCost: gasEstimate?.estimatedNativeGasCost || 0,
        nativeGasToken,
        isValidMerchantAddress,
        isValidAmount,
        statusMessage: `Switch Network: Connected to ${fromChainName}.`,
        detailedExplanation: `Your wallet is currently on ${fromChainName}. This invoice is on ${toChainName}. Please switch your network in 1 click to proceed.`,
      };
    }

    // Rule 3: Merchant Address Rule
    if (!isValidMerchantAddress) {
      return {
        isValid: false,
        state: 'Failed',
        isWalletConnected: true,
        isCorrectNetwork: true,
        currentChainId: walletChainId,
        currentNetworkName,
        targetChainId,
        targetNetworkName,
        hasTokenBalance: true,
        userTokenBalance,
        requiredTokenAmount: tokenAmount,
        tokenSymbol: selectedToken,
        hasGasBalance: true,
        userGasBalance: userNativeGasBalance,
        estimatedGasCost: gasEstimate?.estimatedNativeGasCost || 0,
        nativeGasToken,
        isValidMerchantAddress: false,
        isValidAmount,
        statusMessage: 'Invalid merchant settlement address.',
        detailedExplanation: 'The merchant recipient address is not a valid EVM address format.',
      };
    }

    // Rule 4: Token Contract Availability on Target Chain
    const isConfigured = isTokenConfiguredOnChain(selectedToken, targetChainId);
    if (!isConfigured) {
      return {
        isValid: false,
        state: 'Failed',
        isWalletConnected: true,
        isCorrectNetwork: true,
        currentChainId: walletChainId,
        currentNetworkName,
        targetChainId,
        targetNetworkName,
        hasTokenBalance: false,
        userTokenBalance,
        requiredTokenAmount: tokenAmount,
        tokenSymbol: selectedToken,
        hasGasBalance: true,
        userGasBalance: userNativeGasBalance,
        estimatedGasCost: gasEstimate?.estimatedNativeGasCost || 0,
        nativeGasToken,
        isValidMerchantAddress: true,
        isValidAmount,
        statusMessage: `${selectedToken} is not available on ${targetChain?.shortName || targetNetworkName}.`,
        detailedExplanation: `Please select another supported payment token or network for this invoice.`,
      };
    }

    // Rule 5: Real Token Balance Rule (No Mock Data)
    const hasTokenBalance = userTokenBalance >= tokenAmount;
    if (!hasTokenBalance) {
      const missing = (tokenAmount - userTokenBalance).toFixed(4);
      return {
        isValid: false,
        state: 'Insufficient balance',
        isWalletConnected: true,
        isCorrectNetwork: true,
        currentChainId: walletChainId,
        currentNetworkName,
        targetChainId,
        targetNetworkName,
        hasTokenBalance: false,
        userTokenBalance,
        requiredTokenAmount: tokenAmount,
        tokenSymbol: selectedToken,
        hasGasBalance: true,
        userGasBalance: userNativeGasBalance,
        estimatedGasCost: gasEstimate?.estimatedNativeGasCost || 0,
        nativeGasToken,
        isValidMerchantAddress: true,
        isValidAmount,
        statusMessage: `Insufficient ${selectedToken} balance (${userTokenBalance} available, ${tokenAmount} required).`,
        detailedExplanation: `Your wallet currently holds ${userTokenBalance} ${selectedToken} on ${targetChain?.shortName || targetNetworkName}. You need ${missing} more ${selectedToken} to complete this payment.`,
      };
    }

    // Rule 6: Real Native Gas Balance Rule
    const estimatedGasCost = gasEstimate?.estimatedNativeGasCost || 0.0001;
    const hasGasBalance = userNativeGasBalance >= estimatedGasCost;
    if (!hasGasBalance) {
      return {
        isValid: false,
        state: 'Insufficient gas',
        isWalletConnected: true,
        isCorrectNetwork: true,
        currentChainId: walletChainId,
        currentNetworkName,
        targetChainId,
        targetNetworkName,
        hasTokenBalance: true,
        userTokenBalance,
        requiredTokenAmount: tokenAmount,
        tokenSymbol: selectedToken,
        hasGasBalance: false,
        userGasBalance: userNativeGasBalance,
        estimatedGasCost,
        nativeGasToken,
        isValidMerchantAddress: true,
        isValidAmount,
        statusMessage: `Insufficient ${nativeGasToken} for blockchain network gas fee.`,
        detailedExplanation: `Your wallet has enough ${selectedToken}, but needs at least ~${estimatedGasCost.toFixed(5)} ${nativeGasToken} to cover the blockchain network gas fee on ${targetChain?.shortName || targetNetworkName}.`,
      };
    }

    // All Payment Rules Satisfied -> Ready to Authorize & Pay
    return {
      isValid: true,
      state: 'Ready',
      isWalletConnected: true,
      isCorrectNetwork: true,
      currentChainId: walletChainId,
      currentNetworkName,
      targetChainId,
      targetNetworkName,
      hasTokenBalance: true,
      userTokenBalance,
      requiredTokenAmount: tokenAmount,
      tokenSymbol: selectedToken,
      hasGasBalance: true,
      userGasBalance: userNativeGasBalance,
      estimatedGasCost,
      nativeGasToken,
      isValidMerchantAddress: true,
      isValidAmount,
      statusMessage: `Ready to pay ${tokenAmount} ${selectedToken} on ${targetChain?.shortName || targetNetworkName}.`,
    };
  }
}
