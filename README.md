# Zepp API

Serverless API for Zepp device heart rate and location data.

## Usage

### Push Data
```bash
curl -X POST https://zepp-api.whj.life/api/push \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"heart_rate":75,"location":{"lat":39.9042,"lng":116.4074}}'
```

### Get Data
```bash
curl -X GET https://zepp-api.whj.life/api/get \
  -H "Authorization: Bearer your-token"
```

## Deploy

1. Set environment variables:
   - `REDIS_URL`: Redis connection string
   - `API_TOKEN`: API access token
   - `CACHE_TIME`: Cache expiration time in seconds (optional, default: permanent)
2. Deploy to Vercel

## Tech Stack

- Node.js + Vercel
- Redis (30s TTL)
- Bearer token auth