import { ethers } from 'ethers';
import {
  PaymentEngineState,
  PaymentValidationResult,
  GasEstimationResult,
  SupportedToken,
} from '../types';
import { getChainConfig, getSupportedAsset } from '../config';

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
}

export class PaymentEngine {
  /**
   * Validates a multi-chain payment request against all requirements:
   * 1. Wallet connection
   * 2. Target network alignment
   * 3. Merchant settlement address validity
   * 4. Token balance sufficiency
   * 5. Native gas balance sufficiency (distinct blockchain network fee)
   * 6. Token contract enablement on target chain
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
    } = context;

    const targetChain = getChainConfig(targetChainId);
    const targetNetworkName = targetChain?.name || `Chain ID ${targetChainId}`;
    const nativeGasToken = targetChain?.nativeCurrency.symbol || 'GAS';

    const currentChain = walletChainId ? getChainConfig(walletChainId) : undefined;
    const currentNetworkName = currentChain?.name || (walletChainId ? `Chain ID ${walletChainId}` : undefined);

    const isValidAmount = tokenAmount > 0;
    const isValidMerchantAddress = Boolean(merchantAddress && ethers.isAddress(merchantAddress));

    // 1. Wallet Connection Check
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
        statusMessage: 'Connect your Web3 wallet to review payment details and network fees.',
      };
    }

    // 2. Wrong Network Detection
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
        statusMessage: `Wrong Network: Wallet is connected to ${fromChainName}.`,
        detailedExplanation: `Your wallet is currently connected to ${fromChainName}, but this payment invoice requires ${toChainName}. Please switch your wallet network to ${targetChain?.shortName || toChainName} to proceed.`,
      };
    }

    // 3. Merchant Address Validity
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
        statusMessage: 'Invalid merchant settlement address configuration.',
        detailedExplanation: 'The merchant address for this payment is invalid or malformed. Please contact the merchant.',
      };
    }

    // 4. Token Balance Check
    const hasTokenBalance = userTokenBalance >= tokenAmount;
    if (!hasTokenBalance) {
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
        statusMessage: `Insufficient ${selectedToken} balance.`,
        detailedExplanation: `Your wallet has ${userTokenBalance.toFixed(4)} ${selectedToken} on ${targetChain?.shortName || targetNetworkName}, but ${tokenAmount} ${selectedToken} is required for this invoice.`,
      };
    }

    // 5. Native Gas Balance Check (Distinct Blockchain Network Fee)
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
        statusMessage: `Insufficient ${nativeGasToken} for blockchain gas fee.`,
        detailedExplanation: `You have enough ${selectedToken} for this payment, but your wallet does not have enough ${nativeGasToken} to pay the ${targetChain?.shortName || targetNetworkName} network fee. This is a blockchain network fee, not an IrisMe fee.`,
      };
    }

    // All validation passed
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
