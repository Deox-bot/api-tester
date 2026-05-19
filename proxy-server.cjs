/**
 * API Tester 代理服务器
 * 用于绕过浏览器 CORS 限制
 *
 * 启动: node proxy-server.js
 * 端口: 3001
 */

const http = require('http');
const https = require('https');
const url = require('url');
const crypto = require('crypto');

const PORT = 8080;

// ========== 安全配置 ==========

// API 代理 token（启动时生成，用于认证）
const PROXY_TOKEN = crypto.randomBytes(32).toString('hex');

// 允许的目标域名白名单
const ALLOWED_HOSTS = new Set([
  // OpenAI 系列
  'api.openai.com',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  // 国内 AI 服务
  'api.siliconflow.cn',
  'api.deepseek.com',
  'api.moonshot.cn',
  'api.minimax.chat',
  'api.baichuan-ai.com',
  'api.zhipuai.cn',
  'api.stepfun.com',
  // 其他常见 AI 服务
  'api.groq.com',
  'api.together.xyz',
  'api.fireworks.ai',
  'api.perplexity.ai',
  'api.mistral.ai',
  'api.cohere.ai',
  'api.x.ai',
]);

// 禁止访问的内网/保留地址
const BLOCKED_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^localhost$/i,
  /^.*\.local$/i,
  /^.*\.internal$/i,
];

function isBlockedHost(hostname) {
  return BLOCKED_PATTERNS.some(pattern => pattern.test(hostname));
}

function isAllowedHost(hostname) {
  // 如果白名单不为空，只允许白名单中的域名
  if (ALLOWED_HOSTS.size > 0) {
    return ALLOWED_HOSTS.has(hostname);
  }
  // 否则检查是否是内网地址
  return !isBlockedHost(hostname);
}

const server = http.createServer(async (req, res) => {
  // 只允许本地访问
  const clientIp = req.socket.remoteAddress;
  if (clientIp !== '127.0.0.1' && clientIp !== '::1' && clientIp !== '::ffff:127.0.0.1') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy only accepts connections from localhost' }));
    return;
  }

  // 设置 CORS 头（仅允许本地开发）
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, api-key, anthropic-version, x-proxy-token');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 验证代理 token
  const clientToken = req.headers['x-proxy-token'];
  if (!clientToken || clientToken !== PROXY_TOKEN) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing or invalid proxy token' }));
    return;
  }

  // 解析目标 URL
  const targetUrl = req.url.slice(1); // 去掉开头的 /
  if (!targetUrl || !targetUrl.startsWith('http')) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid target URL. Use: /https://api.example.com/v1/models' }));
    return;
  }

  try {
    const parsedUrl = new URL(targetUrl);

    // 检查目标是否允许
    if (!isAllowedHost(parsedUrl.hostname)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Host '${parsedUrl.hostname}' is not allowed` }));
      return;
    }

    if (isBlockedHost(parsedUrl.hostname)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Access to internal/private addresses is blocked` }));
      return;
    }

    console.log(`[${new Date().toISOString()}] ${req.method} ${parsedUrl.hostname}${parsedUrl.pathname}`);

    const client = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: parsedUrl.hostname,
      },
    };

    // 删除不需要的转发头
    delete options.headers['origin'];
    delete options.headers['referer'];
    delete options.headers['x-proxy-token']; // 不转发代理 token

    const proxyReq = client.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
    });

    req.pipe(proxyReq);

  } catch (err) {
    console.error('Parse error:', err.message);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Parse error: ' + err.message }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 API Tester Proxy Server running on http://127.0.0.1:${PORT}`);
  console.log(`🔒 Proxy Token: ${PROXY_TOKEN}`);
  console.log(`📋 Allowed hosts: ${Array.from(ALLOWED_HOSTS).join(', ')}`);
  console.log(`\n⚠️  请将以上 Token 配置到应用设置中`);
});
