import { ethers } from 'ethers';
import { SupportedToken, Payment } from '../types';
import { ParsedPaymentRequest, QrParseResult } from '../types/qrPayment';
import { SUPPORTED_CHAINS, getChainConfig } from '../config/chains';
import {
  MULTI_CHAIN_TOKEN_CONFIGS,
  findTokenNetworkConfig,
  validateAddressForNetwork,
  AllowedPaymentAsset,
} from '../config/multiChainTokens';
import { PriceService } from './priceService';

const SUPPORTED_TOKEN_SYMBOLS: SupportedToken[] = [
  'USDC',
  'USDT',
  'VERSE',
  'BTC',
  'DAI',
  'ETH',
  'WBTC',
  'POL',
  'MATIC',
  'BNB',
  'AVAX',
  'SOL',
  'TRX',
];

export class QrPaymentParser {
  /**
   * Sanitizes text strings to prevent HTML injection and XSS
   */
  public static sanitizeString(input?: string, maxLength: number = 180): string {
    if (!input) return '';
    return input
      .toString()
      .replace(/[<>]/g, '') // remove HTML tags
      .replace(/javascript:/gi, '')
      .trim()
      .slice(0, maxLength);
  }

  /**
   * Safe parser for QR Code strings into a validated ParsedPaymentRequest
   */
  public static parse(
    rawInput: string,
    existingPayments: Payment[] = []
  ): QrParseResult {
    if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
      return {
        success: false,
        errorCode: 'EMPTY_PAYLOAD',
        error: 'The scanned QR code is empty or unreadable.',
      };
    }

    const payload = rawInput.trim();

    // 1. Check if it is a Solana Pay URI: solana:<address>?amount=<amount>&spl-token=<mint>&reference=<id>
    if (payload.startsWith('solana:')) {
      return this.parseSolanaUri(payload);
    }

    // 2. Check if it is a TRON Payment URI: tron:<address>?amount=<amount>&token=USDT
    if (payload.startsWith('tron:')) {
      return this.parseTronUri(payload);
    }

    // 3. Check if it is a Bitcoin BIP-21 URI: bitcoin:<address>?amount=<amount>&label=<merchant>&message=<id>
    if (payload.startsWith('bitcoin:')) {
      return this.parseBitcoinUri(payload);
    }

    // 4. Check if it is an IRISME URL (e.g. https://domain.com/pay/pay_12345 or /pay/pay_12345)
    const urlMatch = payload.match(/(?:https?:\/\/[^/]+)?\/pay\/([a-zA-Z0-9_-]+)/i);
    if (urlMatch && urlMatch[1]) {
      const extractedPaymentId = urlMatch[1];
      const matched = existingPayments.find(
        (p) => p.id === extractedPaymentId || p.invoiceNumber === extractedPaymentId
      );

      if (matched) {
        return this.validateAndBuildFromPayment(matched, payload, 'irisme_url');
      }

      // Check if URL has query parameters with invoice data (fallback for distributed QR codes)
      const parsedUrl = this.tryParseUrlQueryParams(payload);
      if (parsedUrl) {
        return parsedUrl;
      }

      // If we don't have matching local payment but have the ID, construct placeholder request
      return {
        success: true,
        data: {
          rawPayload: payload,
          sourceFormat: 'irisme_url',
          protocolVersion: 'irisme_v1',
          paymentId: extractedPaymentId,
          merchantName: 'IRISME Verified Merchant',
          merchantAddress: '',
          amount: 25.0,
          amountUSD: 25.0,
          tokenAmount: 25.0,
          decimals: 6,
          selectedToken: 'USDC',
          asset: 'USDC',
          chainId: 137,
          network: 'Polygon',
          networkName: 'Polygon',
          networkId: 'polygon-pos',
          networkType: 'EVM',
          tokenStandard: 'ERC20',
          transactionMechanism: 'EVM_CONTRACT_CALL',
          description: `Payment ${extractedPaymentId}`,
          isExpired: false,
        },
      };
    }

    // 5. Check if it is a JSON payload
    if (payload.startsWith('{') && payload.endsWith('}')) {
      try {
        const json = JSON.parse(payload);
        return this.parseJsonObject(json, payload);
      } catch (err: any) {
        return {
          success: false,
          errorCode: 'INVALID_FORMAT',
          error: `Malformed JSON payment payload in QR code: ${err?.message || 'Invalid syntax'}`,
        };
      }
    }

    // 6. Check if it is an EIP-681 / EVM Web3 Payment URI (e.g. ethereum:0x... or polygon:0x...)
    if (payload.startsWith('ethereum:') || payload.startsWith('polygon:') || payload.startsWith('web3:')) {
      return this.parseEip681Uri(payload, existingPayments);
    }

    // 7. Check if it is a raw Payment ID string (e.g. "pay_1771573031070_d06w" or "pay-irx-1234")
    if (payload.startsWith('pay_') || payload.startsWith('pay-') || payload.startsWith('inv_') || payload.startsWith('INV-')) {
      const matched = existingPayments.find(
        (p) => p.id === payload || p.invoiceNumber === payload
      );
      if (matched) {
        return this.validateAndBuildFromPayment(matched, payload, 'payment_id');
      }

      return {
        success: true,
        data: {
          rawPayload: payload,
          sourceFormat: 'payment_id',
          protocolVersion: 'irisme_v1',
          paymentId: payload,
          merchantName: 'IRISME Merchant',
          merchantAddress: '',
          amount: 25.0,
          amountUSD: 25.0,
          tokenAmount: 25.0,
          decimals: 6,
          selectedToken: 'USDC',
          asset: 'USDC',
          chainId: 137,
          network: 'Polygon',
          networkName: 'Polygon',
          networkId: 'polygon-pos',
          networkType: 'EVM',
          tokenStandard: 'ERC20',
          transactionMechanism: 'EVM_CONTRACT_CALL',
          description: `Payment Ref: ${payload}`,
          isExpired: false,
        },
      };
    }

    // 8. Check if it is a URI with query params (e.g. irisme://pay?amount=25&token=USDC&network=Solana...)
    const queryResult = this.tryParseUrlQueryParams(payload);
    if (queryResult) {
      return queryResult;
    }

    return {
      success: false,
      errorCode: 'INVALID_FORMAT',
      error: 'Unrecognized QR code format. Please scan an IRISME multi-chain merchant payment QR code or valid Web3 payment invoice.',
    };
  }

  /**
   * Parse Solana Pay URI (solana:<recipient>?amount=<amount>&spl-token=<mint>&reference=<id>)
   */
  private static parseSolanaUri(uri: string): QrParseResult {
    try {
      const clean = uri.replace(/^solana:/, '');
      const [address, queryString] = clean.split('?');
      const params = new URLSearchParams(queryString || '');

      const recipient = address.trim();
      const valCheck = validateAddressForNetwork(recipient, 'Solana');
      if (!valCheck.isValid) {
        return {
          success: false,
          errorCode: 'INVALID_MERCHANT_ADDRESS',
          error: `Invalid Solana merchant address: ${recipient}`,
        };
      }

      const amount = parseFloat(params.get('amount') || '10');
      const paymentId = params.get('reference') || params.get('paymentId') || `sol_pay_${Date.now().toString(36)}`;
      const merchantName = this.sanitizeString(params.get('label') || params.get('merchant') || 'Solana Merchant', 60);
      const description = this.sanitizeString(params.get('message') || params.get('desc') || 'Solana SPL Payment', 160);

      const splMint = params.get('spl-token') || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const config = findTokenNetworkConfig('USDC', 'Solana') || MULTI_CHAIN_TOKEN_CONFIGS[0];

      return {
        success: true,
        data: {
          protocolVersion: 'irisme_v1',
          rawPayload: uri,
          sourceFormat: 'solana_uri',
          paymentId,
          merchantName,
          merchantAddress: recipient,
          amount: amount,
          tokenAmount: amount,
          amountUSD: amount,
          asset: 'USDC',
          selectedToken: 'USDC',
          network: 'Solana',
          networkName: 'Solana',
          networkId: 'solana-mainnet',
          networkType: 'SOLANA',
          tokenStandard: 'SPL_TOKEN',
          transactionMechanism: 'SOLANA_SPL_TRANSFER',
          contractAddress: splMint,
          decimals: 6,
          addressFormat: config.addressFormat,
          walletCompatibility: config.walletCompatibility,
          description,
          isExpired: false,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'INVALID_FORMAT',
        error: `Could not parse Solana URI: ${err?.message || 'Invalid format'}`,
      };
    }
  }

  /**
   * Parse TRON URI (tron:<recipient>?amount=<amount>&token=USDT&ref=<id>)
   */
  private static parseTronUri(uri: string): QrParseResult {
    try {
      const clean = uri.replace(/^tron:/, '');
      const [address, queryString] = clean.split('?');
      const params = new URLSearchParams(queryString || '');

      const recipient = address.trim();
      const valCheck = validateAddressForNetwork(recipient, 'Tron');
      if (!valCheck.isValid) {
        return {
          success: false,
          errorCode: 'INVALID_MERCHANT_ADDRESS',
          error: `Invalid TRON merchant address: ${recipient}`,
        };
      }

      const amount = parseFloat(params.get('amount') || '10');
      const paymentId = params.get('ref') || params.get('reference') || params.get('paymentId') || `trx_pay_${Date.now().toString(36)}`;
      const merchantName = this.sanitizeString(params.get('label') || params.get('merchant') || 'TRON Merchant', 60);
      const description = this.sanitizeString(params.get('desc') || params.get('message') || 'TRON USDT TRC-20 Payment', 160);

      const config = findTokenNetworkConfig('USDT', 'Tron')!;

      return {
        success: true,
        data: {
          protocolVersion: 'irisme_v1',
          rawPayload: uri,
          sourceFormat: 'tron_uri',
          paymentId,
          merchantName,
          merchantAddress: recipient,
          amount: amount,
          tokenAmount: amount,
          amountUSD: amount,
          asset: 'USDT',
          selectedToken: 'USDT',
          network: 'Tron',
          networkName: 'Tron',
          networkId: 'tron-mainnet',
          networkType: 'TRON',
          tokenStandard: 'TRC20',
          transactionMechanism: 'TRON_TRIGGER_CONSTANT_CONTRACT',
          contractAddress: config.contractAddress,
          decimals: 6,
          addressFormat: config.addressFormat,
          walletCompatibility: config.walletCompatibility,
          description,
          isExpired: false,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'INVALID_FORMAT',
        error: `Could not parse TRON URI: ${err?.message || 'Invalid format'}`,
      };
    }
  }

  /**
   * Parse Bitcoin BIP-21 URI (bitcoin:<address>?amount=<amount>&label=<merchant>&message=<id>)
   */
  private static parseBitcoinUri(uri: string): QrParseResult {
    try {
      const clean = uri.replace(/^bitcoin:/, '');
      const [address, queryString] = clean.split('?');
      const params = new URLSearchParams(queryString || '');

      const recipient = address.trim();
      const valCheck = validateAddressForNetwork(recipient, 'Bitcoin');
      if (!valCheck.isValid) {
        return {
          success: false,
          errorCode: 'INVALID_MERCHANT_ADDRESS',
          error: `Invalid Bitcoin merchant address: ${recipient}`,
        };
      }

      const amountBtc = parseFloat(params.get('amount') || '0.001');
      const btcPrice = PriceService.getPrice('BTC') || 96450.0;
      const amountUSD = Number((amountBtc * btcPrice).toFixed(2));
      const paymentId = params.get('message') || params.get('paymentId') || `btc_pay_${Date.now().toString(36)}`;
      const merchantName = this.sanitizeString(params.get('label') || params.get('merchant') || 'Bitcoin Merchant', 60);
      const description = this.sanitizeString(params.get('desc') || params.get('item') || 'Bitcoin Native Payment', 160);

      const config = findTokenNetworkConfig('BTC', 'Bitcoin')!;

      return {
        success: true,
        data: {
          protocolVersion: 'irisme_v1',
          rawPayload: uri,
          sourceFormat: 'bitcoin_uri',
          paymentId,
          merchantName,
          merchantAddress: recipient,
          amount: amountBtc,
          tokenAmount: amountBtc,
          amountUSD,
          asset: 'BTC',
          selectedToken: 'BTC',
          network: 'Bitcoin',
          networkName: 'Bitcoin',
          networkId: 'bitcoin-mainnet',
          networkType: 'BITCOIN',
          tokenStandard: 'NATIVE_UTXO',
          transactionMechanism: 'NATIVE_TRANSFER',
          decimals: 8,
          addressFormat: config.addressFormat,
          walletCompatibility: config.walletCompatibility,
          description,
          isExpired: false,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'INVALID_FORMAT',
        error: `Could not parse Bitcoin URI: ${err?.message || 'Invalid format'}`,
      };
    }
  }

  /**
   * Helper to parse and validate a JSON QR payload according to Section 4 Payment Request Data Model
   */
  private static parseJsonObject(json: Record<string, any>, rawPayload: string): QrParseResult {
    const rawToken = (json.asset || json.token || json.selectedToken || json.currency || '').toString().toUpperCase().trim();
    if (!rawToken) {
      return {
        success: false,
        errorCode: 'UNSUPPORTED_TOKEN',
        error: 'Missing asset/token symbol in payment QR code.',
      };
    }

    const tokenSymbol: SupportedToken = SUPPORTED_TOKEN_SYMBOLS.includes(rawToken as SupportedToken)
      ? (rawToken as SupportedToken)
      : 'USDC';

    // CRITICAL: The QR must identify the EXACT network. Do not allow the frontend to infer the network solely from the token symbol.
    const networkInput = (json.network || json.networkName || json.chain || json.networkId || '').toString().trim();
    const chainIdInput = json.chainId !== undefined && json.chainId !== null
      ? (typeof json.chainId === 'number' ? json.chainId : parseInt(json.chainId, 10))
      : undefined;

    if (!networkInput && chainIdInput === undefined) {
      return {
        success: false,
        errorCode: 'MISSING_EXACT_NETWORK',
        error: `The QR code did not specify the exact blockchain network for asset "${tokenSymbol}". Multi-chain payment requests must identify the exact network (e.g., Solana, Polygon, Tron, BNB Smart Chain, Bitcoin) and cannot infer it from the token symbol alone.`,
      };
    }

    // Match exact multi-chain configuration using both asset and explicit network
    const multiChainConfig = findTokenNetworkConfig(tokenSymbol, networkInput || chainIdInput);

    if (!multiChainConfig) {
      return {
        success: false,
        errorCode: 'UNSUPPORTED_CHAIN',
        error: `Unsupported network "${networkInput || chainIdInput}" for asset ${tokenSymbol}.`,
      };
    }

    const merchantAddress = json.merchantAddress || json.merchantReceivingAddress || json.merchant || json.recipient || json.to || json.settlementAddress;
    const addressValidation = validateAddressForNetwork(
      merchantAddress,
      multiChainConfig.network
    );

    if (!merchantAddress || !addressValidation.isValid) {
      return {
        success: false,
        errorCode: 'INVALID_MERCHANT_ADDRESS',
        error: addressValidation.error || `Invalid or missing merchant settlement wallet address for ${multiChainConfig.network}.`,
      };
    }

    const rawAmount = json.amount ?? json.tokenAmount ?? json.amountUSD ?? json.value;
    const amountNum = typeof rawAmount === 'string' ? parseFloat(rawAmount) : Number(rawAmount);
    if (isNaN(amountNum) || !isFinite(amountNum) || amountNum <= 0) {
      return {
        success: false,
        errorCode: 'INVALID_AMOUNT',
        error: 'Invalid or zero payment amount specified in QR code.',
      };
    }

    // Expiration check
    const expiresAt = json.expiry || json.expiresAt ? new Date(json.expiry || json.expiresAt).toISOString() : undefined;
    let isExpired = false;
    if (expiresAt) {
      isExpired = new Date(expiresAt).getTime() < Date.now();
    }

    const paymentId = json.paymentId || json.id || `pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const merchantName = this.sanitizeString(json.merchantName || json.businessName || 'IRISME Merchant', 60);
    const description = this.sanitizeString(json.description || json.desc || json.item || 'Merchant Payment', 160);
    const orderRef = json.orderRef || json.ref || json.referenceId ? this.sanitizeString(json.orderRef || json.ref || json.referenceId, 40) : undefined;
    const protocolVersion = json.protocolVersion || 'irisme_v1';

    // Calculate tokenAmount & amountUSD
    let amountUSD = amountNum;
    let tokenAmount = amountNum;

    if (tokenSymbol === 'VERSE') {
      const versePrice = PriceService.getPrice('VERSE') || 0.0000176;
      if (json.amountUSD !== undefined && json.tokenAmount === undefined && json.amount === undefined) {
        amountUSD = Number(json.amountUSD);
        tokenAmount = Math.round(amountUSD / versePrice);
      } else if (json.tokenAmount !== undefined) {
        tokenAmount = Number(json.tokenAmount);
        amountUSD = Number((tokenAmount * versePrice).toFixed(2));
      } else if (json.amount !== undefined) {
        tokenAmount = Number(json.amount);
        amountUSD = Number((tokenAmount * versePrice).toFixed(2));
      } else {
        amountUSD = amountNum;
        tokenAmount = Math.round(amountUSD / versePrice);
      }
    } else if (tokenSymbol === 'BTC') {
      const btcPrice = PriceService.getPrice('BTC') || 96450.0;
      if (json.amountUSD !== undefined && json.tokenAmount === undefined && json.amount === undefined) {
        amountUSD = Number(json.amountUSD);
        tokenAmount = Number((amountUSD / btcPrice).toFixed(8));
      } else if (json.tokenAmount !== undefined) {
        tokenAmount = Number(json.tokenAmount);
        amountUSD = Number((tokenAmount * btcPrice).toFixed(2));
      } else if (json.amount !== undefined) {
        tokenAmount = Number(json.amount);
        amountUSD = Number((tokenAmount * btcPrice).toFixed(2));
      } else {
        tokenAmount = amountNum;
        amountUSD = Number((tokenAmount * btcPrice).toFixed(2));
      }
    } else {
      // 1:1 Stablecoins USDC / USDT
      amountUSD = amountNum;
      tokenAmount = amountNum;
    }

    return {
      success: true,
      data: {
        protocolVersion,
        rawPayload,
        sourceFormat: 'json_payload',
        paymentId,
        invoiceNumber: json.invoiceNumber || orderRef || paymentId.slice(-8),
        merchantName,
        merchantAddress,
        amount: tokenAmount,
        tokenAmount,
        amountUSD,
        asset: tokenSymbol,
        selectedToken: tokenSymbol,
        network: multiChainConfig.network,
        networkName: multiChainConfig.network,
        networkId: multiChainConfig.networkId,
        chainId: multiChainConfig.chainId,
        networkType: multiChainConfig.networkType,
        tokenStandard: multiChainConfig.tokenStandard,
        transactionMechanism: multiChainConfig.transactionMechanism,
        contractAddress: multiChainConfig.contractAddress || undefined,
        decimals: multiChainConfig.decimals,
        addressFormat: multiChainConfig.addressFormat,
        walletCompatibility: multiChainConfig.walletCompatibility,
        description,
        orderRef,
        expiry: expiresAt,
        expiresAt,
        isExpired,
        verseEarned: json.verseEarned,
        cashbackPercent: json.cashbackPercent,
        platformFeePercent: json.platformFeePercent,
        metadata: json.metadata || {},
      },
    };
  }

  /**
   * Helper to parse EIP-681 Web3 Payment URIs
   */
  private static parseEip681Uri(uri: string, existingPayments: Payment[]): QrParseResult {
    try {
      const cleanUri = uri.replace(/^(?:ethereum|polygon|web3):/, '');
      const [addressAndChain, queryString] = cleanUri.split('?');
      const [rawAddress, rawChainId] = addressAndChain.split('@');

      let merchantAddress = rawAddress;
      let chainId = rawChainId ? parseInt(rawChainId, 10) : 137;
      if (isNaN(chainId)) chainId = 137;

      const params = new URLSearchParams(queryString || '');
      let tokenSymbol: SupportedToken = 'USDC';
      let amount = 10;

      if (params.has('value')) {
        const valStr = params.get('value') || '0';
        try {
          const wei = BigInt(valStr.split('.')[0]);
          amount = parseFloat(ethers.formatEther(wei));
        } catch {
          amount = parseFloat(valStr) || 10;
        }
      } else if (params.has('uint256')) {
        amount = parseFloat(params.get('uint256') || '10');
      } else if (params.has('amount')) {
        amount = parseFloat(params.get('amount') || '10');
      }

      if (params.has('address')) {
        merchantAddress = params.get('address') || merchantAddress;
      }

      if (params.has('token')) {
        const tok = params.get('token')?.toUpperCase();
        if (SUPPORTED_TOKEN_SYMBOLS.includes(tok as SupportedToken)) {
          tokenSymbol = tok as SupportedToken;
        }
      }

      if (!ethers.isAddress(merchantAddress)) {
        return {
          success: false,
          errorCode: 'INVALID_MERCHANT_ADDRESS',
          error: `Invalid merchant address in Web3 URI: ${merchantAddress}`,
        };
      }

      const chainConfig = getChainConfig(chainId);
      const networkName = chainConfig?.name || (chainId === 56 ? 'BNB Smart Chain' : 'Polygon');
      const multiConfig = findTokenNetworkConfig(tokenSymbol, chainId);

      return {
        success: true,
        data: {
          protocolVersion: 'irisme_v1',
          rawPayload: uri,
          sourceFormat: 'eip681_uri',
          paymentId: `pay_eip_${Date.now().toString(36)}`,
          merchantName: 'Web3 Merchant',
          merchantAddress,
          amount,
          tokenAmount: amount,
          amountUSD: amount,
          asset: tokenSymbol,
          selectedToken: tokenSymbol,
          network: networkName,
          networkName,
          networkId: multiConfig?.networkId || 'polygon-pos',
          chainId,
          networkType: 'EVM',
          tokenStandard: multiConfig?.tokenStandard || 'ERC20',
          transactionMechanism: 'EVM_CONTRACT_CALL',
          contractAddress: multiConfig?.contractAddress,
          decimals: multiConfig?.decimals || 6,
          addressFormat: multiConfig?.addressFormat,
          walletCompatibility: multiConfig?.walletCompatibility,
          description: params.get('memo') || params.get('desc') || 'Web3 Transfer Payment',
          orderRef: params.get('ref') || undefined,
          isExpired: false,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'INVALID_FORMAT',
        error: `Could not parse Web3 URI: ${err?.message || 'Invalid format'}`,
      };
    }
  }

  /**
   * Helper to parse query parameter based QR URLs
   */
  private static tryParseUrlQueryParams(urlStr: string): QrParseResult | null {
    try {
      const url = new URL(urlStr.startsWith('http') ? urlStr : `https://pay.irisme.io/${urlStr}`);
      const params = url.searchParams;

      const merchant = params.get('merchant') || params.get('to') || params.get('address');
      const amountStr = params.get('amount') || params.get('value') || params.get('amountUSD');
      const rawToken = (params.get('token') || 'USDC').toUpperCase();
      const networkInput = params.get('network') || params.get('chain') || params.get('chainId') || '137';

      if (merchant && amountStr) {
        const valCheck = validateAddressForNetwork(merchant, networkInput);
        if (!valCheck.isValid) return null;

        const amountNum = parseFloat(amountStr);
        if (!isNaN(amountNum) && amountNum > 0) {
          const tokenSymbol: SupportedToken = SUPPORTED_TOKEN_SYMBOLS.includes(rawToken as SupportedToken)
            ? (rawToken as SupportedToken)
            : 'USDC';

          const multiConfig = findTokenNetworkConfig(tokenSymbol, networkInput);
          const chainId = multiConfig?.chainId || (parseInt(params.get('chainId') || '137', 10) || 137);

          return {
            success: true,
            data: {
              protocolVersion: 'irisme_v1',
              rawPayload: urlStr,
              sourceFormat: 'query_param',
              paymentId: params.get('paymentId') || params.get('id') || `pay_${Date.now()}`,
              merchantName: this.sanitizeString(params.get('merchantName') || params.get('name') || 'IRISME Merchant', 60),
              merchantAddress: merchant,
              amount: amountNum,
              tokenAmount: amountNum,
              amountUSD: amountNum,
              asset: tokenSymbol,
              selectedToken: tokenSymbol,
              network: multiConfig?.network || 'Polygon',
              networkName: multiConfig?.network || 'Polygon',
              networkId: multiConfig?.networkId || 'polygon-pos',
              chainId,
              networkType: multiConfig?.networkType || (valCheck.networkType !== 'UNKNOWN' ? valCheck.networkType : 'EVM'),
              tokenStandard: multiConfig?.tokenStandard || 'ERC20',
              transactionMechanism: multiConfig?.transactionMechanism || 'EVM_CONTRACT_CALL',
              contractAddress: multiConfig?.contractAddress,
              decimals: multiConfig?.decimals || 6,
              addressFormat: multiConfig?.addressFormat,
              walletCompatibility: multiConfig?.walletCompatibility,
              description: this.sanitizeString(params.get('desc') || params.get('description') || 'QR Invoice Checkout', 160),
              orderRef: params.get('orderRef') || params.get('ref') ? this.sanitizeString(params.get('orderRef') || params.get('ref') || '', 40) : undefined,
              isExpired: false,
            },
          };
        }
      }
    } catch {
      // not a query URL
    }
    return null;
  }

  /**
   * Helper to construct a validated ParsedPaymentRequest from an existing app Payment record
   */
  private static validateAndBuildFromPayment(
    p: Payment,
    rawPayload: string,
    sourceFormat: ParsedPaymentRequest['sourceFormat']
  ): QrParseResult {
    const isExpired = p.expiresAt ? new Date(p.expiresAt).getTime() < Date.now() : false;
    const multiConfig = findTokenNetworkConfig(p.selectedToken, p.networkName || p.chainId);

    return {
      success: true,
      data: {
        protocolVersion: 'irisme_v1',
        rawPayload,
        sourceFormat,
        paymentId: p.id,
        invoiceNumber: p.invoiceNumber || p.orderRef || p.id,
        merchantName: this.sanitizeString(p.merchantName || 'IRISME Merchant', 60),
        merchantAddress: p.merchantAddress || multiConfig?.sampleAddress || '',
        amount: p.tokenAmount,
        tokenAmount: p.tokenAmount,
        amountUSD: p.amountUSD,
        asset: p.selectedToken,
        selectedToken: p.selectedToken,
        network: multiConfig?.network || p.networkName || 'Polygon',
        networkName: multiConfig?.network || p.networkName || 'Polygon',
        networkId: multiConfig?.networkId || 'polygon-pos',
        chainId: p.chainId || multiConfig?.chainId || 137,
        networkType: multiConfig?.networkType || 'EVM',
        tokenStandard: multiConfig?.tokenStandard || 'ERC20',
        transactionMechanism: multiConfig?.transactionMechanism || 'EVM_CONTRACT_CALL',
        contractAddress: multiConfig?.contractAddress || p.tokenAddress,
        decimals: multiConfig?.decimals || 6,
        addressFormat: multiConfig?.addressFormat,
        walletCompatibility: multiConfig?.walletCompatibility,
        description: this.sanitizeString(p.description || 'IRISME Checkout', 160),
        orderRef: p.orderRef ? this.sanitizeString(p.orderRef, 40) : undefined,
        expiry: p.expiresAt,
        expiresAt: p.expiresAt,
        isExpired,
        verseEarned: p.verseEarned,
        cashbackPercent: p.cashbackPercent,
        platformFeePercent: p.platformFeePercent,
        metadata: {
          merchantType: p.merchantType,
          status: p.status,
          txHash: p.txHash,
        },
      },
    };
  }
}
