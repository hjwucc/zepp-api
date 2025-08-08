import { initRedisClient, validateToken, formatUpdateTime, validateDataFormat } from '../lib/utils.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

export async function POST(request) {
  try {
    if (!validateToken({ headers: { authorization: request.headers.get('authorization') } })) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const data = await request.json();
    if (!validateDataFormat(data)) {
      return new Response(JSON.stringify({ error: 'Invalid data format' }), { status: 400, headers: corsHeaders });
    }

    const redis = await initRedisClient();
    const promises = [];
    const cacheTime = process.env.CACHE_TIME ? parseInt(process.env.CACHE_TIME) : null;
    
    if (data.heart_rate !== undefined) {
      const setOptions = cacheTime ? { EX: cacheTime } : {};
      promises.push(redis.set('heart_rate', JSON.stringify(data.heart_rate), setOptions));
    }
    if (data.location !== undefined) {
      const setOptions = cacheTime ? { EX: cacheTime } : {};
      promises.push(redis.set('location', JSON.stringify(data.location), setOptions));
    }
    
    await Promise.all(promises);
    await redis.disconnect();

    return new Response(JSON.stringify({
      success: true,
      updated: formatUpdateTime()
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}