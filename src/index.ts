import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

// Token price cache (simple in-memory)
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

// Birdeye API key (free tier available)
const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY || '';

// Common Solana token addresses
const TOKENS: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  JTO: 'JTO4wqGzAkWPQpSWf6k1eUhNsY9ZJdDVsMXo3RLiR1P',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeDsVE4iSVydDGYdsH9g7s',
  PYTH: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACkQg5',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm'
};

// Get token price from Birdeye
async function getTokenPrice(mint: string): Promise<number | null> {
  // Check cache first
  const cached = priceCache.get(mint);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.price;
  }

  try {
    const response = await fetch(`https://public-api.birdeye.so/public/price?address=${mint}`, {
      headers: BIRDEYE_API_KEY ? { 'X-API-KEY': BIRDEYE_API_KEY } : {}
    });

    if (!response.ok) {
      console.error(`Birdeye API error: ${response.status}`);
      return null;
    }

    const data = await response.json() as any;
    const price = data?.data?.value || null;

    if (price !== null) {
      priceCache.set(mint, { price, timestamp: Date.now() });
    }

    return price;
  } catch (error) {
    console.error('Error fetching price:', error);
    return null;
  }
}

// GET /price/:symbol — Get token price
app.get('/price/:symbol', async (c) => {
  const symbol = c.req.param('symbol').toUpperCase();
  const mint = TOKENS[symbol];

  if (!mint) {
    return c.json({
      error: 'Token not found',
      availableTokens: Object.keys(TOKENS),
      timestamp: new Date().toISOString()
    }, 404);
  }

  const price = await getTokenPrice(mint);

  if (price === null) {
    return c.json({
      error: 'Price unavailable',
      symbol,
      mint,
      timestamp: new Date().toISOString()
    }, 503);
  }

  return c.json({
    symbol,
    mint,
    price,
    priceUsd: price,
    timestamp: new Date().toISOString(),
    source: 'Birdeye Public API'
  });
});

// GET /prices — Get all tracked prices
app.get('/prices', async (c) => {
  const results: Record<string, number | null> = {};

  for (const [symbol, mint] of Object.entries(TOKENS)) {
    results[symbol] = await getTokenPrice(mint);
  }

  const validPrices = Object.entries(results).filter(([_, p]) => p !== null);

  return c.json({
    timestamp: new Date().toISOString(),
    totalTracked: Object.keys(TOKENS).length,
    availablePrices: validPrices.length,
    prices: results,
    source: 'Birdeye Public API'
  });
});

// GET / — API documentation
app.get('/', (c) => c.json({
  name: 'x402 Solana Price Feed',
  version: '1.0.0',
  description: 'Real-time Solana token prices from Birdeye API',
  endpoints: {
    'GET /price/:symbol': {
      description: 'Get price for a specific token',
      example: '/price/SOL',
      response: { symbol: 'SOL', price: 137.5 }
    },
    'GET /prices': {
      description: 'Get prices for all tracked tokens',
      response: { prices: { SOL: 137.5, USDC: 1.0 } }
    }
  },
  trackedTokens: Object.keys(TOKENS),
  dataSource: 'Birdeye Public API',
  cacheTtl: '30 seconds',
  timestamp: new Date().toISOString()
}));

// Health check
app.get('/health', (c) => c.json({
  status: 'ok',
  uptime: process.uptime(),
  timestamp: new Date().toISOString()
}));

const port = process.env.PORT || 3000;
serve({ fetch: app.fetch, port });
console.log(`🚀 x402 Solana Price Feed running on port ${port}`);
console.log(`📊 Tracking ${Object.keys(TOKENS).length} tokens`);
console.log(`💾 Cache TTL: ${CACHE_TTL}ms`);
