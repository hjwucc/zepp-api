import { createClient } from 'redis';

export async function initRedisClient() {
  const client = createClient({
    url: process.env.REDIS_URL,
    socket: { connectTimeout: 5000, keepAlive: false }
  });
  
  await client.connect();
  return client;
}

export function validateToken(req) {
  const validToken = process.env.API_TOKEN || 'test-token-123';
  const authHeader = req.headers?.authorization;
  const apiToken = req.headers?.['x-api-token'];
  
  const clientToken = authHeader?.startsWith('Bearer ') 
    ? authHeader.replace('Bearer ', '') 
    : apiToken;
    
  return clientToken === validToken;
}

export function formatUpdateTime() {
  return new Date().toISOString();
}

export function validateDataFormat(data) {
  if (!data || typeof data !== 'object') return false;
  if (!data.heart_rate && !data.location) return false;
  
  if (data.heart_rate !== undefined) {
    if (typeof data.heart_rate !== 'number' || data.heart_rate <= 0 || data.heart_rate >= 200) {
      return false;
    }
  }
  
  if (data.location !== undefined) {
    const { lat, lng } = data.location;
    if (typeof lat !== 'number' || typeof lng !== 'number' ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return false;
    }
  }
  
  return true;
}