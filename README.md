# Zepp API

基于 Vercel 的 Serverless API 服务，用于接收和查询 Zepp 设备的心率和地理位置数据。数据通过 Redis 缓存 30 秒。

## API 接口

### POST /api/push
推送心率或地理位置数据
```bash
curl -X POST https://your-project.vercel.app/api/push \
  -H "Content-Type: application/json" \
  -H "X-API-Token: your-token" \
  -d '{"type":"heart_rate","value":75}'
```

### GET /api/get
获取最新数据
```bash
curl -X GET https://your-project.vercel.app/api/get \
  -H "X-API-Token: your-token"
```

## 部署

1. 获取 Redis 服务（推荐 [Redis Labs](https://redis.com/)）
2. 上传代码到 GitHub
3. 在 [Vercel](https://vercel.com/) 导入项目
4. 配置环境变量：
   - `REDIS_URL`: Redis 连接字符串
   - `API_TOKEN`: API 访问令牌（可选）

## 本地测试

```bash
npm run test
```

## 技术栈

- Node.js + Vercel Serverless
- Redis 缓存（30秒过期）
- Token 认证