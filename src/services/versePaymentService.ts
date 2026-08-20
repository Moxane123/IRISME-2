/**
 * VERSE Payment Service for IRISME
 * 
 * Implements the exact Polygon Mainnet (Chain ID 137) VERSE Payment Flow:
 * 1. Verify Network: Must be Polygon Mainnet (137). Display "Please switch to Polygon."
 * 2. Read VERSE Balance & Decimals dynamically from VITE_VERSE_TOKEN_CONTRACT.
 * 3. Check allowance for VITE_PAYMENT_ROUTER_CONTRACT.
 * 4. Request exact ERC-20 approval if allowance is insufficient and await receipt.
 * 5. Call Payment Router pay(merchant, amount, paymentId) with cryptographically secure bytes32 paymentId.
 * 6. User confirms in wallet and await Polygon transaction receipt.
 * 7. Parse Payment event and verify on-chain settlement.
 * 8. Return verified payment details with PolygonScan link.
 */

import { ethers, Contract } from 'ethers';
import { ERC20_ABI } from '../config/tokens';
import { PAYMENT_ROUTER_ABI, getVerseTokenContractAddress, getPaymentRouterAddress } from '../config/contracts';
import { BlockchainService } from './blockchainService';

export interface VersePaymentStepUpdate {
  step:
    | 'network_check'
    | 'balance_check'
    | 'allowance_check'
    | 'approving'
    | 'approval_confirmed'
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
  approvalTxHash?: string;
  paymentId: string;
  amountFormatted: string;
  rawAmount: bigint;
  tokenSymbol: 'VERSE';
  merchantAddress: string;
  payerAddress: string;
  blockNumber: number;
  polygonScanUrl: string;
  eventDetails?: {
    payer: string;
    merchant: string;
    amount: bigint;
    paymentId: string;
  };
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
      throw new Error('VERSE token contract address is not configured or invalid (VITE_VERSE_TOKEN_CONTRACT).');
    }

    const provider =
      BlockchainService.getBrowserProvider() ||
      BlockchainService.getFallbackProvider(this.POLYGON_CHAIN_ID);
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);

    // Read decimals dynamically - never hardcode
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
   * Reads the current VERSE allowance granted to the Payment Router contract
   */
  public static async getVerseAllowance(userAddress: string): Promise<{
    allowanceFormatted: number;
    rawAllowance: bigint;
    decimals: number;
    routerAddress: string;
  }> {
    if (!ethers.isAddress(userAddress)) {
      throw new Error('Invalid wallet address.');
    }

    const routerAddress = getPaymentRouterAddress(this.POLYGON_CHAIN_ID);
    if (!routerAddress || !ethers.isAddress(routerAddress)) {
      throw new Error('Payment Router contract address is not configured or invalid (VITE_PAYMENT_ROUTER_CONTRACT).');
    }

    const tokenAddress = getVerseTokenContractAddress(this.POLYGON_CHAIN_ID);
    const provider =
      BlockchainService.getBrowserProvider() ||
      BlockchainService.getFallbackProvider(this.POLYGON_CHAIN_ID);
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);

    const decimals = Number(await tokenContract.decimals());
    const rawAllowance: bigint = await tokenContract.allowance(userAddress, routerAddress);
    const allowanceFormatted = Number(ethers.formatUnits(rawAllowance, decimals));

    return {
      allowanceFormatted,
      rawAllowance,
      decimals,
      routerAddress,
    };
  }

  /**
   * Executes the exact, verified VERSE Payment Flow
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
      throw new Error('Invalid merchant address.');
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
      // Per exact requirement: prevent payment and display "Please switch to Polygon."
      // Do not silently switch networks.
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
      throw new Error('VERSE token contract address is not configured (VITE_VERSE_TOKEN_CONTRACT).');
    }

    const verseContract = new Contract(verseTokenAddress, ERC20_ABI, signer);

    // Read decimals dynamically - never hardcode
    const decimals = Number(await verseContract.decimals());

    // Format exact raw amount for ERC-20
    const amountStr =
      typeof verseAmount === 'number'
        ? verseAmount.toFixed(Math.min(decimals, 6))
        : verseAmount;
    const rawPaymentAmount = ethers.parseUnits(amountStr, decimals);

    // Read user's actual VERSE balance
    const rawUserBalance: bigint = await verseContract.balanceOf(userAddress);

    if (rawUserBalance < rawPaymentAmount) {
      const userBalanceFormatted = ethers.formatUnits(rawUserBalance, decimals);
      throw new Error(
        `Insufficient VERSE balance. You have ${parseFloat(userBalanceFormatted).toLocaleString()} VERSE, but ${parseFloat(amountStr).toLocaleString()} VERSE is required.`
      );
    }

    // -------------------------------------------------------------
    // 3. CHECK ALLOWANCE
    // -------------------------------------------------------------
    onStepUpdate?.({ step: 'allowance_check', message: 'Checking Payment Router allowance...' });

    const routerAddress = getPaymentRouterAddress(this.POLYGON_CHAIN_ID);
    if (!routerAddress || !ethers.isAddress(routerAddress)) {
      throw new Error(
        'Payment Router contract address is not configured (VITE_PAYMENT_ROUTER_CONTRACT).'
      );
    }

    const currentAllowance: bigint = await verseContract.allowance(userAddress, routerAddress);

    let approvalTxHash: string | undefined;

    // -------------------------------------------------------------
    // 4. VERSE APPROVAL (If allowance is insufficient)
    // -------------------------------------------------------------
    if (currentAllowance < rawPaymentAmount) {
      onStepUpdate?.({
        step: 'approving',
        message: 'Please approve the VERSE spending request in your wallet...',
      });

      try {
        // Prefer approving only the exact payment amount rather than an unlimited allowance
        const approveTx = await verseContract.approve(routerAddress, rawPaymentAmount);
        approvalTxHash = approveTx.hash;

        onStepUpdate?.({
          step: 'approving',
          message: 'Waiting for approval confirmation on Polygon...',
          txHash: approveTx.hash,
        });

        // Wait for approval transaction receipt before continuing
        const approveReceipt = await approveTx.wait(1);

        if (!approveReceipt || approveReceipt.status === 0) {
          throw new Error('VERSE approval transaction failed on-chain.');
        }

        onStepUpdate?.({
          step: 'approval_confirmed',
          message: 'VERSE approval confirmed on Polygon.',
          txHash: approveTx.hash,
        });
      } catch (err: any) {
        if (this.isUserRejection(err)) {
          throw new Error('User rejected the VERSE approval request in wallet.');
        }
        throw new Error(err?.message || 'VERSE approval transaction failed.');
      }
    }

    // -------------------------------------------------------------
    // 5. GENERATE CRYPTOGRAPHICALLY SECURE UNIQUE PAYMENT ID
    // -------------------------------------------------------------
    // Generate a unique "bytes32" payment ID for every payment using cryptographically secure random value
    const randomBytes = ethers.randomBytes(32);
    const paymentIdBytes32 = ethers.hexlify(randomBytes);

    // -------------------------------------------------------------
    // 6. PAYMENT ROUTER & WALLET CONFIRMATION
    // -------------------------------------------------------------
    onStepUpdate?.({
      step: 'awaiting_payment',
      message: 'Please confirm the payment transaction in your wallet...',
    });

    const routerContract = new Contract(routerAddress, PAYMENT_ROUTER_ABI, signer);

    let payTx: ethers.TransactionResponse;

    try {
      // Call pay(address merchant, uint256 amount, bytes32 paymentId)
      payTx = await routerContract.pay(merchantAddress, rawPaymentAmount, paymentIdBytes32);

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
    // 7. AWAIT POLYGON CONFIRMATION RECEIPT
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

    // -------------------------------------------------------------
    // 8. PARSE PAYMENT EVENT
    // -------------------------------------------------------------
    let eventDetails: VersePaymentExecutionResult['eventDetails'] | undefined;

    if (receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        try {
          const parsed = routerContract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });

          if (parsed && parsed.name === 'Payment') {
            eventDetails = {
              payer: parsed.args.payer,
              merchant: parsed.args.merchant,
              amount: parsed.args.amount,
              paymentId: parsed.args.paymentId,
            };
            break;
          }
        } catch {
          // Continue checking other logs
        }
      }
    }

    const polygonScanUrl = `https://polygonscan.com/tx/${payTx.hash}`;

    onStepUpdate?.({
      step: 'confirmed',
      message: 'Payment confirmed successfully on Polygon.',
      txHash: payTx.hash,
    });

    return {
      success: true,
      txHash: payTx.hash,
      approvalTxHash,
      paymentId: paymentIdBytes32,
      amountFormatted: amountStr,
      rawAmount: rawPaymentAmount,
      tokenSymbol: 'VERSE',
      merchantAddress,
      payerAddress: userAddress,
      blockNumber: receipt.blockNumber,
      polygonScanUrl,
      eventDetails,
    };
  }
}
