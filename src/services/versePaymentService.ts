/**
 * VERSE Payment Service for IRISME
 * 
 * Implements the direct, non-custodial Polygon Mainnet (Chain ID 137) VERSE Payment Flow:
 * 1. Verify Network: Must be Polygon Mainnet (137). If not, prompts "Please switch to Polygon."
 * 2. Read VERSE Balance & Decimals dynamically from Polygon contract (0xc708d6f2153933daa50b2d0758955be0a93a8fec).
 * 3. User confirms direct ERC-20 transfer in wallet directly to merchant's settlement address.
 * 4. Await Polygon transaction confirmation receipt.
 * 5. Return verified payment details with PolygonScan link.
 */

import { ethers, Contract } from 'ethers';
import { ERC20_ABI } from '../config/tokens';
import { getVerseTokenContractAddress } from '../config/contracts';
import { BlockchainService } from './blockchainService';

export interface VersePaymentStepUpdate {
  step:
    | 'network_check'
    | 'balance_check'
    | 'awaiting_payment'
    | 'submitting'
    | 'confirming'
    | 'confirmed'
    | 'failed';
  message: string;
  txHash?: string;
}

export interface VersePaymentExecutionParams {
  merchantAddress: string;
  verseAmount: number | string; // Amount in human-readable VERSE (e.g. 500 or "500.5")
  onStepUpdate?: (update: VersePaymentStepUpdate) => void;
}

export interface VersePaymentExecutionResult {
  success: boolean;
  txHash: string;
  paymentId: string;
  amountFormatted: string;
  rawAmount: bigint;
  tokenSymbol: 'VERSE';
  merchantAddress: string;
  payerAddress: string;
  blockNumber: number;
  polygonScanUrl: string;
}

export class VersePaymentService {
  public static readonly POLYGON_CHAIN_ID = 137;

  /**
   * Helper to parse user rejection errors
   */
  public static isUserRejection(err: any): boolean {
    if (!err) return false;
    return (
      err.code === 4001 ||
      err.code === 'ACTION_REJECTED' ||
      err.info?.error?.code === 4001 ||
      err.message?.toLowerCase().includes('user rejected') ||
      err.message?.toLowerCase().includes('user denied') ||
      err.message?.toLowerCase().includes('rejected') ||
      err.message?.toLowerCase().includes('modal closed')
    );
  }

  /**
   * Reads dynamic VERSE token decimals and user balance from contract
   */
  public static async getVerseBalanceAndDecimals(userAddress: string): Promise<{
    balanceFormatted: number;
    rawBalance: bigint;
    decimals: number;
    tokenAddress: string;
  }> {
    if (!ethers.isAddress(userAddress)) {
      throw new Error('Invalid wallet address.');
    }

    const tokenAddress = getVerseTokenContractAddress(this.POLYGON_CHAIN_ID);
    if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
      throw new Error('VERSE token contract address is not configured or invalid.');
    }

    const provider =
      BlockchainService.getBrowserProvider() ||
      BlockchainService.getFallbackProvider(this.POLYGON_CHAIN_ID);
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);

    // Read decimals dynamically
    const decimals = Number(await tokenContract.decimals());
    const rawBalance: bigint = await tokenContract.balanceOf(userAddress);
    const balanceFormatted = Number(ethers.formatUnits(rawBalance, decimals));

    return {
      balanceFormatted,
      rawBalance,
      decimals,
      tokenAddress,
    };
  }

  /**
   * Executes direct, non-custodial VERSE peer-to-merchant payment on Polygon
   */
  public static async executePayment(
    params: VersePaymentExecutionParams
  ): Promise<VersePaymentExecutionResult> {
    const { merchantAddress, verseAmount, onStepUpdate } = params;

    // -------------------------------------------------------------
    // VALIDATE INPUT PARAMETERS
    // -------------------------------------------------------------
    const numAmount = typeof verseAmount === 'string' ? parseFloat(verseAmount) : verseAmount;
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Invalid payment amount.');
    }

    if (!merchantAddress || !ethers.isAddress(merchantAddress)) {
      throw new Error('Invalid merchant settlement address.');
    }

    // -------------------------------------------------------------
    // 1. VERIFY NETWORK
    // -------------------------------------------------------------
    onStepUpdate?.({ step: 'network_check', message: 'Verifying Polygon network...' });

    if (!BlockchainService.isEthereumAvailable()) {
      throw new Error('No Web3 wallet detected. Please connect your Web3 wallet.');
    }

    const provider = BlockchainService.getBrowserProvider();
    if (!provider) {
      throw new Error('Could not access Web3 wallet provider.');
    }

    const network = await provider.getNetwork();
    const currentChainId = Number(network.chainId);

    if (currentChainId !== this.POLYGON_CHAIN_ID) {
      throw new Error('Please switch to Polygon.');
    }

    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    if (!userAddress || !ethers.isAddress(userAddress)) {
      throw new Error('Wallet is not connected.');
    }

    // -------------------------------------------------------------
    // 2. READ VERSE BALANCE & DECIMALS
    // -------------------------------------------------------------
    onStepUpdate?.({ step: 'balance_check', message: 'Checking VERSE balance on Polygon...' });

    const verseTokenAddress = getVerseTokenContractAddress(this.POLYGON_CHAIN_ID);
    if (!verseTokenAddress || !ethers.isAddress(verseTokenAddress)) {
      throw new Error('VERSE token contract address is not configured.');
    }

    const verseContract = new Contract(verseTokenAddress, ERC20_ABI, signer);

    const decimals = Number(await verseContract.decimals());
    const amountStr =
      typeof verseAmount === 'number'
        ? verseAmount.toFixed(Math.min(decimals, 6))
        : verseAmount;
    const rawPaymentAmount = ethers.parseUnits(amountStr, decimals);

    const rawUserBalance: bigint = await verseContract.balanceOf(userAddress);

    if (rawUserBalance < rawPaymentAmount) {
      const userBalanceFormatted = ethers.formatUnits(rawUserBalance, decimals);
      throw new Error(
        `Insufficient VERSE balance. You have ${parseFloat(userBalanceFormatted).toLocaleString()} VERSE, but ${parseFloat(amountStr).toLocaleString()} VERSE is required.`
      );
    }

    // -------------------------------------------------------------
    // 3. DIRECT ERC-20 TRANSFER TO MERCHANT (NON-CUSTODIAL)
    // -------------------------------------------------------------
    onStepUpdate?.({
      step: 'awaiting_payment',
      message: 'Please confirm the VERSE payment transaction in your wallet...',
    });

    let payTx: ethers.TransactionResponse;

    try {
      // Direct transfer to merchant settlement wallet
      payTx = await verseContract.transfer(merchantAddress, rawPaymentAmount);

      onStepUpdate?.({
        step: 'submitting',
        message: 'Payment transaction submitted to Polygon...',
        txHash: payTx.hash,
      });
    } catch (err: any) {
      if (this.isUserRejection(err)) {
        throw new Error('User rejected the payment transaction in wallet.');
      }
      throw new Error(err?.message || 'Payment transaction failed to submit.');
    }

    // -------------------------------------------------------------
    // 4. AWAIT POLYGON CONFIRMATION RECEIPT
    // -------------------------------------------------------------
    onStepUpdate?.({
      step: 'confirming',
      message: 'Confirming payment on Polygon blockchain...',
      txHash: payTx.hash,
    });

    const receipt = await payTx.wait(1);

    if (!receipt) {
      throw new Error('No transaction receipt received from RPC node.');
    }

    if (receipt.status === 0) {
      throw new Error('Payment transaction reverted on Polygon.');
    }

    const randomBytes = ethers.randomBytes(16);
    const paymentId = 'pay_' + ethers.hexlify(randomBytes).slice(2);

    onStepUpdate?.({
      step: 'confirmed',
      message: 'Payment verified and settled on Polygon!',
      txHash: payTx.hash,
    });

    return {
      success: true,
      txHash: payTx.hash,
      paymentId,
      amountFormatted: amountStr,
      rawAmount: rawPaymentAmount,
      tokenSymbol: 'VERSE',
      merchantAddress,
      payerAddress: userAddress,
      blockNumber: receipt.blockNumber,
      polygonScanUrl: `https://polygonscan.com/tx/${payTx.hash}`,
    };
  }
}
