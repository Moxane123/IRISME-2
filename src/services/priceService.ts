export interface CryptoPrice {
  symbol: string;
  name: string;
  priceUSD: number;
  change24h: number;
  lastUpdated: number;
}

export type PriceMap = Record<string, CryptoPrice>;

// Fallback baseline prices in case public APIs are temporarily throttled
export const INITIAL_REALTIME_PRICES: PriceMap = {
  BTC: { symbol: 'BTC', name: 'Bitcoin', priceUSD: 96450.0, change24h: 2.34, lastUpdated: Date.now() },
  ETH: { symbol: 'ETH', name: 'Ethereum', priceUSD: 2780.5, change24h: -0.85, lastUpdated: Date.now() },
  SOL: { symbol: 'SOL', name: 'Solana', priceUSD: 184.2, change24h: 4.12, lastUpdated: Date.now() },
  BNB: { symbol: 'BNB', name: 'BNB', priceUSD: 645.8, change24h: 1.05, lastUpdated: Date.now() },
  TRX: { symbol: 'TRX', name: 'TRON', priceUSD: 0.245, change24h: 0.65, lastUpdated: Date.now() },
  VERSE: { symbol: 'VERSE', name: 'Verse', priceUSD: 0.00034, change24h: 5.4, lastUpdated: Date.now() },
  USDT: { symbol: 'USDT', name: 'Tether USD', priceUSD: 1.0, change24h: 0.01, lastUpdated: Date.now() },
  USDC: { symbol: 'USDC', name: 'USD Coin', priceUSD: 1.0, change24h: 0.0, lastUpdated: Date.now() },
  MATIC: { symbol: 'MATIC', name: 'Polygon POL', priceUSD: 0.442, change24h: -1.2, lastUpdated: Date.now() },
  POL: { symbol: 'POL', name: 'Polygon POL', priceUSD: 0.442, change24h: -1.2, lastUpdated: Date.now() },
  AVAX: { symbol: 'AVAX', name: 'Avalanche', priceUSD: 27.8, change24h: 1.9, lastUpdated: Date.now() },
  DAI: { symbol: 'DAI', name: 'Dai Stablecoin', priceUSD: 1.0, change24h: 0.0, lastUpdated: Date.now() },
};

export class PriceService {
  private static cachedPrices: PriceMap = { ...INITIAL_REALTIME_PRICES };
  private static lastFetchTime: number = 0;
  private static CACHE_TTL_MS: number = 20_000; // 20s cache
  private static listeners: Set<(prices: PriceMap) => void> = new Set();

  /**
   * Fetches real-time crypto prices from live server or public price feeds
   */
  public static async fetchRealtimePrices(): Promise<PriceMap> {
    const now = Date.now();
    if (now - this.lastFetchTime < this.CACHE_TTL_MS && Object.keys(this.cachedPrices).length > 0) {
      return this.cachedPrices;
    }

    try {
      // 1. Try local server endpoint first
      const response = await fetch('/api/prices', { signal: AbortSignal.timeout(3500) });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.prices) {
          this.cachedPrices = { ...this.cachedPrices, ...data.prices };
          this.lastFetchTime = now;
          this.notifyListeners();
          return this.cachedPrices;
        }
      }
    } catch {
      // Server endpoint not ready, try direct public API
    }

    try {
      // 2. Direct Binance public price tickers
      const binanceRes = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","TRXUSDT","POLUSDT","AVAXUSDT"]', {
        signal: AbortSignal.timeout(4000),
      });
      if (binanceRes.ok) {
        const tickers: any[] = await binanceRes.json();
        tickers.forEach((t) => {
          const sym = t.symbol.replace('USDT', '');
          const key = sym === 'POL' ? 'MATIC' : sym;
          const price = parseFloat(t.lastPrice);
          const change = parseFloat(t.priceChangePercent);
          if (price > 0) {
            this.cachedPrices[key] = {
              symbol: key,
              name: key,
              priceUSD: price,
              change24h: change,
              lastUpdated: Date.now(),
            };
            if (key === 'MATIC') {
              this.cachedPrices['POL'] = { ...this.cachedPrices['MATIC'], symbol: 'POL' };
            }
          }
        });
        this.lastFetchTime = now;
        this.notifyListeners();
      }
    } catch {
      // Keep existing cached prices
    }

    return this.cachedPrices;
  }

  /**
   * Synchronous getter for immediate component rendering
   */
  public static getPrice(symbol: string): number {
    const normalized = symbol.toUpperCase();
    if (this.cachedPrices[normalized]) {
      return this.cachedPrices[normalized].priceUSD;
    }
    if (normalized === 'POL' && this.cachedPrices['MATIC']) {
      return this.cachedPrices['MATIC'].priceUSD;
    }
    if (normalized === 'USDT' || normalized === 'USDC' || normalized === 'DAI') {
      return 1.0;
    }
    if (normalized === 'VERSE') {
      return 0.00034;
    }
    return 1.0;
  }

  public static getPriceObject(symbol: string): CryptoPrice {
    const normalized = symbol.toUpperCase();
    return (
      this.cachedPrices[normalized] || {
        symbol: normalized,
        name: normalized,
        priceUSD: this.getPrice(symbol),
        change24h: 0,
        lastUpdated: Date.now(),
      }
    );
  }

  public static getAllPrices(): PriceMap {
    return { ...this.cachedPrices };
  }

  public static subscribe(callback: (prices: PriceMap) => void): () => void {
    this.listeners.add(callback);
    callback(this.cachedPrices);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private static notifyListeners() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.cachedPrices);
      } catch {}
    });
  }
}
