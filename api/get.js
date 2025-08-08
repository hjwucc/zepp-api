import { initRedisClient, validateToken, formatUpdateTime } from '../lib/utils.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

export async function GET(request) {
  try {
    if (!validateToken({ headers: { authorization: request.headers.get('authorization') } })) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const redis = await initRedisClient();
    const [heartRate, location] = await Promise.all([
      redis.get('heart_rate'),
      redis.get('location')
    ]);
    await redis.disconnect();

    return new Response(JSON.stringify({
      heart_rate: heartRate ? JSON.parse(heartRate) : null,
      location: location ? JSON.parse(location) : null,
      updated: formatUpdateTime()
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}