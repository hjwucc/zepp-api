import {
  initRedisClient,
  validateToken,
  validateDataFormat,
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
  setCorsHeaders(res, 'POST, OPTIONS');

  // 处理预检请求
  if (handleOptionsRequest(req, res)) {
    return;
  }

  // 验证请求方法
  if (!validateHttpMethod(req, res, 'POST')) {
    return;
  }

  // Token验证
  if (!validateToken(req)) {
    return handleTokenValidationFailure(res);
  }

  try {
    // 验证数据格式
    if (!validateDataFormat(req.body)) {
      return res.status(400).json({
        error: '数据格式无效',
        message: '请检查type和value的格式'
      });
    }

    const { type, value } = req.body;
    
    // 连接Redis并存储数据
    const redisClient = await initRedisClient();
    try {
      await redisClient.set(type, JSON.stringify(value), { EX: 30 });
    } finally {
      await redisClient.disconnect();
    }

    return res.status(200).json({
      status: 'ok',
      message: `已缓存${type}数据`,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error(`数据处理失败: ${err.message}`);
    return res.status(500).json({
      error: '服务器错误',
      message: '数据处理失败，请稍后重试'
    });
  }
}