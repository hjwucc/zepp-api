import {
  initRedisClient,
  validateToken,
  formatUpdateTime,
  setCorsHeaders,
  handleOptionsRequest,
  validateHttpMethod,
  handleTokenValidationFailure
} from '../lib/utils.js';

/**
 * 主处理函数
 */
export default async function handler(req, res) {
  // 设置CORS响应头
  setCorsHeaders(res, 'GET, OPTIONS');

  // 处理预检请求
  if (handleOptionsRequest(req, res)) {
    return;
  }

  // 验证请求方法
  if (!validateHttpMethod(req, res, 'GET')) {
    return;
  }

  // Token验证
  if (!validateToken(req)) {
    return handleTokenValidationFailure(res);
  }

  try {
    // 连接Redis并获取数据
    const redisClient = await initRedisClient();
    let heartRateStr, locationStr;
    
    try {
      [heartRateStr, locationStr] = await Promise.all([
        redisClient.get('heart_rate'),
        redisClient.get('location')
      ]);
    } finally {
      await redisClient.disconnect();
    }

    return res.status(200).json({
      heart_rate: heartRateStr ? JSON.parse(heartRateStr) : null,
      location: locationStr ? JSON.parse(locationStr) : null,
      updated: formatUpdateTime(),
      status: 'success'
    });

  } catch (err) {
    console.error(`数据查询失败: ${err.message}`);
    return res.status(500).json({
      error: '服务器错误',
      message: '获取数据失败，请稍后重试',
      updated: formatUpdateTime()
    });
  }
}