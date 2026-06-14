/**
 * API 连通性快速测试
 * 直接用 Node.js 测试，不走浏览器 CORS
 */

const APIs = [
  // 硅基流动相关
  { name: '硅基流动-1', url: 'https://api.siliconflow.cn', key: '', type: 'openai' },
  { name: '硅基流动-2', url: 'https://api.siliconflow.cn/v1', key: '', type: 'openai' },
];

async function testAPI(config) {
  const base = config.url.replace(/\/+$/, '');
  const modelsUrl = `${base}/models`;

  console.log(`\n📡 测试: ${config.name}`);
  console.log(`   URL: ${modelsUrl}`);

  const headers = {
    'Content-Type': 'application/json',
    ...(config.key ? { 'Authorization': `Bearer ${config.key}` } : {}),
  };

  const start = Date.now();
  try {
    const resp = await fetch(modelsUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    });

    const time = Date.now() - start;
    const text = await resp.text();

    console.log(`   ✅ HTTP ${resp.status} (${time}ms)`);

    // 解析模型
    try {
      const json = JSON.parse(text);
      if (json.data && Array.isArray(json.data)) {
        const models = json.data.map(m => m.id || m.name).slice(0, 5);
        console.log(`   📋 模型列表 (前5个): ${models.join(', ')}`);
        console.log(`   📊 共 ${json.data.length} 个模型`);
      } else if (json.models && Array.isArray(json.models)) {
        // 修复：使用 json.models 而不是 json.data
        const models = json.models.slice(0, 5).map(m => m.name?.replace('models/', ''));
        console.log(`   📋 模型列表 (前5个): ${models.join(', ')}`);
      } else {
        console.log(`   📋 响应格式: ${Object.keys(json).join(', ')}`);
      }
    } catch {
      console.log(`   📄 响应: ${text.substring(0, 100)}...`);
    }
  } catch (e) {
    console.log(`   ❌ 失败: ${e.message}`);
  }
}

async function main() {
  console.log('=== API 连通性测试 ===');

  // 测试公共端点（不需要 Key）
  const publicAPIs = [
    { name: 'OpenAI 官方', url: 'https://api.openai.com/v1' },
    { name: '硅基流动', url: 'https://api.siliconflow.cn/v1' },
    { name: 'DeepSeek', url: 'https://api.deepseek.com/v1' },
    { name: 'Groq', url: 'https://api.groq.com/openai/v1' },
    { name: 'Together AI', url: 'https://api.together.xyz/v1' },
  ];

  for (const api of publicAPIs) {
    await testAPI({ ...api, key: '' });
  }
}

main().catch(console.error);
