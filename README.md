# 🔥 x402 Solana Price Feed

Production-ready Solana token price API with **real-time data from Birdeye**.

## What It Does

Returns current prices for 10+ Solana tokens:
- SOL, USDC, USDT, BONK, JUP, JTO, RAY, ORCA, PYTH, WIF

## Quick Start

```bash
# Clone
git clone https://github.com/Valentinasmith722/x402-solana-price-feed.git
cd x402-solana-price-feed

# Install
npm install

# Build
npm run build

# Run
npm start
```

## API Endpoints

### GET /price/:symbol

```bash
curl http://localhost:3000/price/SOL
```

Response:
```json
{
  "symbol": "SOL",
  "mint": "So11111111111111111111111111111111111111112",
  "price": 137.50,
  "priceUsd": 137.50,
  "timestamp": "2026-07-09T19:15:00.000Z",
  "source": "Birdeye Public API"
}
```

### GET /prices

```bash
curl http://localhost:3000/prices
```

Returns all tracked token prices.

## Deploy to Railway (Free)

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `BIRDEYE_API_KEY` | No | API key for higher rate limits |

## Data Source

Prices from [Birdeye](https://birdeye.so) Public API:
- Free tier: 100 requests/minute
- No API key required for basic usage
- 30-second in-memory cache

## License

MIT — Build freely, earn passively.

---

*This tool is 100% free and open source. If it helped you, consider supporting development.*

**Solana (USDT):** `BKjS4agVRowFGqUuWHEKZerk3dCS52V1n4NdWaeNTo8E`
