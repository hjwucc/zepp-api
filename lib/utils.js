import { createClient } from 'redis';

/**
 * 初始化Redis客户端
 * @returns {Promise<import('redis').RedisClientType>} Redis客户端实例
 */
export async function initRedisClient() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL环境变量未配置');
  }

  const client = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 5000,
      keepAlive: false
    }
  });

  client.on('error', (err) => {
    console.error(`Redis客户端错误: ${err.message}`);
  });

  try {
    await client.connect();
    return client;
  } catch (err) {
    console.error(`Redis连接失败: ${err.message}`);
    throw new Error('缓存服务连接失败');
  }
}

/**
 * Token权限验证（支持默认值）
 * @param {import('next').NextApiRequest} req - 请求对象
 * @returns {boolean} 验证结果
 */
export function validateToken(req) {
  // 优先使用环境变量的Token，未配置则使用默认值
  const validToken = process.env.API_TOKEN || 'zepp-api-token-123456';
  const clientToken = req.headers['x-api-token'];

  return typeof clientToken === 'string' && clientToken === validToken;
}

/**
 * 格式化时间
 * @returns {string} 格式化后的时间字符串
 */
export function formatUpdateTime() {
  const now = new Date();
  return now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * 验证数据格式
 * @param {Object} data - 请求体数据
 * @returns {boolean} 验证结果
 */
export function validateDataFormat(data) {
  if (typeof data !== 'object' || data === null || !data.type || data.value === undefined) {
    return false;
  }

  if (!['heart_rate', 'location'].includes(data.type)) {
    return false;
  }

  if (data.type === 'heart_rate') {
    return typeof data.value === 'number' && data.value > 0 && data.value < 200;
  }

  if (data.type === 'location') {
    return (
      typeof data.value === 'object' &&
      data.value !== null &&
      typeof data.value.lat === 'number' &&
      typeof data.value.lng === 'number' &&
      data.value.lat >= -90 && data.value.lat <= 90 &&
      data.value.lng >= -180 && data.value.lng <= 180
    );
  }

  return false;
}

/**
 * 设置通用的CORS响应头
 * @param {import('next').NextApiResponse} res - 响应对象
 * @param {string} allowedMethods - 允许的HTTP方法
 */
export function setCorsHeaders(res, allowedMethods = 'GET, POST, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', allowedMethods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Token');
  res.setHeader('Cache-Control', 'no-store');
}

/**
 * 处理预检请求
 * @param {import('next').NextApiRequest} req - 请求对象
 * @param {import('next').NextApiResponse} res - 响应对象
 * @returns {boolean} 是否为预检请求
 */
export function handleOptionsRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

/**
 * 验证HTTP方法
 * @param {import('next').NextApiRequest} req - 请求对象
 * @param {import('next').NextApiResponse} res - 响应对象
 * @param {string} allowedMethod - 允许的HTTP方法
 * @returns {boolean} 方法是否有效
 */
export function validateHttpMethod(req, res, allowedMethod) {
  if (req.method !== allowedMethod) {
    res.status(405).json({
      error: '方法不允许',
      message: `仅支持${allowedMethod}请求`
    });
    return false;
  }
  return true;
}

/**
 * 处理Token验证失败
 * @param {import('next').NextApiResponse} res - 响应对象
 */
export function handleTokenValidationFailure(res) {
  res.status(401).json({
    error: '权限验证失败',
    message: '请提供有效的X-API-Token'
  });
}