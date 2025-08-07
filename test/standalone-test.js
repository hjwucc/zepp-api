/**
 * 独立本地测试脚本
 * 不依赖 Vercel 开发服务器，直接测试 API 函数
 */

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// 加载 .env 文件
function loadEnvFile() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    envLines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key] = value;
        }
      }
    });
    
    console.log('✅ 已加载 .env 文件');
  } else {
    console.log('⚠️  未找到 .env 文件，使用默认配置');
  }
}

// 加载环境变量
loadEnvFile();

// 设置默认值（如果环境变量未设置）
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.API_TOKEN = process.env.API_TOKEN || 'zepp-api-token-123456';

/**
 * 模拟 Vercel Request 对象
 */
class MockRequest {
  constructor(method, headers = {}, body = null) {
    this.method = method;
    this.headers = headers;
    // 如果 body 是字符串，解析为 JSON 对象
    if (typeof body === 'string') {
      try {
        this.body = JSON.parse(body);
      } catch (error) {
        this.body = body;
      }
    } else {
      this.body = body;
    }
  }

  async json() {
    return this.body;
  }
}

/**
 * 模拟 Vercel Response 对象
 */
class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.body = null;
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  setHeader(name, value) {
    this.headers[name] = value;
    return this;
  }

  json(data) {
    this.body = data;
    return this;
  }

  end(data) {
    if (data) this.body = data;
    return this;
  }
}

/**
 * 动态导入 API 函数
 */
async function importAPIFunction(apiPath) {
  try {
    const fullPath = path.resolve(__dirname, '..', apiPath);
    const module = await import(`file://${fullPath}`);
    return module.default;
  } catch (error) {
    console.error(`导入 ${apiPath} 失败:`, error.message);
    return null;
  }
}

/**
 * 测试数据推送 API
 */
async function testPushAPI() {
  console.log('\n=== 测试数据推送接口 ===');
  
  const pushHandler = await importAPIFunction('api/push.js');
  if (!pushHandler) {
    console.log('❌ 无法加载 push API');
    return false;
  }

  try {
    // 测试心率数据推送
    console.log('\n1. 测试心率数据推送...');
    const heartRateReq = new MockRequest('POST', {
      'content-type': 'application/json',
      'x-api-token': process.env.API_TOKEN
    }, JSON.stringify({
      type: 'heart_rate',
      value: 75
    }));
    
    const heartRateRes = new MockResponse();
    await pushHandler(heartRateReq, heartRateRes);
    
    console.log('心率数据推送结果:');
    console.log('- 状态码:', heartRateRes.statusCode);
    console.log('- 响应体:', heartRateRes.body);
    
    // 测试地理位置数据推送
    console.log('\n2. 测试地理位置数据推送...');
    const locationReq = new MockRequest('POST', {
      'content-type': 'application/json',
      'x-api-token': process.env.API_TOKEN
    }, JSON.stringify({
      type: 'location',
      value: {
        lat: 39.9042,
        lng: 116.4074
      }
    }));
    
    const locationRes = new MockResponse();
    await pushHandler(locationReq, locationRes);
    
    console.log('地理位置数据推送结果:');
    console.log('- 状态码:', locationRes.statusCode);
    console.log('- 响应体:', locationRes.body);
    
    // 测试无效数据
    console.log('\n3. 测试无效数据格式...');
    const invalidReq = new MockRequest('POST', {
      'content-type': 'application/json',
      'x-api-token': process.env.API_TOKEN
    }, JSON.stringify({
      type: 'invalid_type',
      value: 'invalid_value'
    }));
    
    const invalidRes = new MockResponse();
    await pushHandler(invalidReq, invalidRes);
    
    console.log('无效数据测试结果:');
    console.log('- 状态码:', invalidRes.statusCode);
    console.log('- 响应体:', invalidRes.body);
    
    return heartRateRes.statusCode === 200 && locationRes.statusCode === 200;
    
  } catch (error) {
    console.error('❌ 推送 API 测试失败:', error.message);
    return false;
  }
}

/**
 * 测试数据查询 API
 */
async function testGetAPI() {
  console.log('\n=== 测试数据查询接口 ===');
  
  const getHandler = await importAPIFunction('api/get.js');
  if (!getHandler) {
    console.log('❌ 无法加载 get API');
    return false;
  }

  try {
    // 等待一秒确保数据已存储
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试正常数据查询
    console.log('\n1. 测试正常数据查询...');
    const getReq = new MockRequest('GET', {
      'x-api-token': process.env.API_TOKEN
    });
    
    const getRes = new MockResponse();
    await getHandler(getReq, getRes);
    
    console.log('数据查询结果:');
    console.log('- 状态码:', getRes.statusCode);
    console.log('- 响应体:', getRes.body);
    
    // 测试无效 Token
    console.log('\n2. 测试无效 Token...');
    const invalidTokenReq = new MockRequest('GET', {
      'x-api-token': 'invalid-token'
    });
    
    const invalidTokenRes = new MockResponse();
    await getHandler(invalidTokenReq, invalidTokenRes);
    
    console.log('无效 Token 测试结果:');
    console.log('- 状态码:', invalidTokenRes.statusCode);
    console.log('- 响应体:', invalidTokenRes.body);
    
    return getRes.statusCode === 200;
    
  } catch (error) {
    console.error('❌ 查询 API 测试失败:', error.message);
    return false;
  }
}

/**
 * 检查 Redis 连接
 */
async function checkRedisConnection() {
  console.log('\n=== 检查 Redis 连接 ===');
  
  try {
    // 动态导入 utils
    const utilsPath = path.resolve(__dirname, '..', 'lib/utils.js');
    const utils = await import(`file://${utilsPath}`);
    
    const redis = await utils.initRedisClient();
    
    // 测试连接
    await redis.ping();
    console.log('✅ Redis 连接正常');
    
    // 测试基本操作
    await redis.set('test_key', 'test_value', { EX: 5 });
    const value = await redis.get('test_key');
    
    if (value === 'test_value') {
      console.log('✅ Redis 读写操作正常');
    } else {
      console.log('❌ Redis 读写操作异常');
    }
    
    await redis.del('test_key');
    await redis.quit();
    
    return true;
    
  } catch (error) {
    console.error('❌ Redis 连接失败:', error.message);
    console.log('请检查:');
    console.log('1. Redis 服务是否正在运行');
    console.log('2. REDIS_URL 环境变量是否正确配置');
    console.log('3. 网络连接是否正常');
    return false;
  }
}

/**
 * 运行独立测试
 */
async function runStandaloneTests() {
  console.log('🚀 开始独立本地测试');
  console.log('配置信息:');
  console.log('- Redis URL:', process.env.REDIS_URL);
  console.log('- API Token:', process.env.API_TOKEN);
  
  try {
    // 检查 Redis 连接
    const redisOk = await checkRedisConnection();
    if (!redisOk) {
      console.log('\n❌ 测试终止：Redis 连接失败');
      console.log('\n💡 解决方案:');
      console.log('1. 启动本地 Redis 服务');
      console.log('2. 或使用在线 Redis 服务（如 Redis Labs）');
      console.log('3. 确保 .env 文件中的 REDIS_URL 配置正确');
      return;
    }
    
    // 运行 API 测试
    const pushSuccess = await testPushAPI();
    const getSuccess = await testGetAPI();
    
    // 测试结果总结
    console.log('\n=== 测试结果总结 ===');
    console.log('Redis 连接:', redisOk ? '✅ 正常' : '❌ 失败');
    console.log('数据推送测试:', pushSuccess ? '✅ 通过' : '❌ 失败');
    console.log('数据查询测试:', getSuccess ? '✅ 通过' : '❌ 失败');
    
    if (redisOk && pushSuccess && getSuccess) {
      console.log('\n🎉 所有测试通过！API 功能正常');
      console.log('\n📝 下一步:');
      console.log('1. 可以部署到 Vercel 生产环境');
      console.log('2. 或登录 Vercel 使用 npm run dev 进行完整测试');
    } else {
      console.log('\n⚠️  部分测试失败，请检查配置和服务状态');
    }
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
  }
}

// 运行独立测试
runStandaloneTests();

// ES 模块导出
export {
  testPushAPI,
  testGetAPI,
  checkRedisConnection,
  runStandaloneTests
};