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

const PORT = 3001;

const server = http.createServer(async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, api-key, anthropic-version');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 解析目标 URL
  const targetUrl = req.url.slice(1); // 去掉开头的 /
  if (!targetUrl || !targetUrl.startsWith('http')) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid target URL. Use: /https://api.example.com/v1/models' }));
    return;
  }

  console.log(`[${new Date().toISOString()}] ${req.method} ${targetUrl}`);

  try {
    const parsedUrl = new URL(targetUrl);
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

server.listen(PORT, () => {
  console.log(`🚀 API Tester Proxy Server running on http://localhost:${PORT}`);
  console.log(`📖 Usage: http://localhost:${PORT}/https://api.example.com/v1/models`);
});
