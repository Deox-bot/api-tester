/**
 * API 测试工具函数
 * 负责发送测试请求、解析响应、处理错误
 * 支持：连通性、余额查询、对话可用性、延迟测速、Key 有效性、速率限制
 */

import {
  ApiConfig, TestResult, BalanceInfo, RateLimitInfo,
  ChatTestResult, LatencyResult, KeyErrorType,
} from '../types';
import { TEST_TIMEOUT_MS } from '../constants';

// 主入口

/**
 * 测试单个 API（全量测试项）
 * 改进：各阶段独立，一个失败不影响其他，能拿到什么显示什么
 */
export async function testApiConnectivity(config: ApiConfig): Promise<TestResult> {
  const startTime = Date.now();
  const base = config.baseUrl.replace(/\/+$/, '');
  const result: TestResult = { apiId: config.id, status: 'testing' };

  try {
    // ── 1. 连通性 + 模型列表 ──────────────────
    const connectivity = await testConnectivity(config, base, startTime);
    Object.assign(result, connectivity);

    // 即使连通性失败，也尝试分析错误类型
    if (result.status === 'error') {
      result.keyErrorType = detectKeyError(result.statusCode, result.errorMessage);
      result.testedAt = Date.now();
      return result; // 连通性都没法测，直接返回
    }

    // ── 2. 余额查询（独立 try-catch，失败不影响其他）───
    try {
      result.balance = await queryBalance(config, base);
    } catch (e: any) {
      result.balance = { supported: false, error: e.message };
    }

    // ── 3. 速率限制（从响应头提取） ─────────────
    if (result.responseHeaders) {
      result.rateLimit = parseRateLimitHeaders(result.responseHeaders);
    }

    // ── 4. 对话可用性测试（独立 try-catch）─────────────
    try {
      result.chatTest = await testChatAvailability(config, base);
    } catch (e: any) {
      result.chatTest = { available: false, error: e.message };
    }

    // ── 5. 延迟测速（独立 try-catch，3 次 ping）──────────────
    try {
      result.latency = await measureLatency(config, base, 3);
    } catch (e: any) {
      result.latency = undefined; // 测速失败不显示
    }

    result.status = 'success';
    result.testedAt = Date.now();
    return result;

  } catch (error: any) {
    return {
      ...result,
      status: 'error',
      responseTime: Date.now() - startTime,
      errorMessage: error.message || '未知错误',
      testedAt: Date.now(),
    };
  }
}

// 1. 连通性 + 模型列表

async function testConnectivity(
  config: ApiConfig,
  base: string,
  startTime: number,
): Promise<Partial<TestResult>> {
  const testUrl = buildModelsUrl(config, base);
  const headers = buildHeaders(config);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(testUrl, {
      method: 'GET',
      headers,
      signal: controller.signal as any,
    });
  } catch (fetchError: any) {
    clearTimeout(timeoutId);
    if (fetchError.name === 'AbortError') {
      return {
        status: 'error',
        responseTime: TEST_TIMEOUT_MS,
        errorMessage: `请求超时（${TEST_TIMEOUT_MS / 1000}秒），请确认 API 地址可达`,
        testedAt: Date.now(),
      };
    }
    return {
      status: 'error',
      responseTime: Date.now() - startTime,
      errorMessage: `网络请求失败（${fetchError?.message || 'Failed to fetch'}）。如确认 API 地址正确，可能是 CORS 限制，建议通过后端代理访问。`,
      testedAt: Date.now(),
    };
  }

  clearTimeout(timeoutId);
  const responseTime = Date.now() - startTime;

  // 收集响应头
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key.toLowerCase()] = value;
  });

  let responseText = '';
  try { responseText = await response.text(); } catch { /* ignore */ }

  if (!response.ok) {
    return {
      status: 'error',
      statusCode: response.status,
      responseTime,
      responseHeaders,
      errorMessage: `HTTP ${response.status}: ${response.statusText}\n${responseText.substring(0, 500)}`,
      rawResponse: responseText.substring(0, 2000),
      testedAt: Date.now(),
    };
  }

  let models: string[] = [];
  let modelCount = 0;
  let rawResponse = responseText.substring(0, 2000);

  try {
    const json = JSON.parse(responseText);
    models = extractModels(json, config.type);
    modelCount = models.length;
  } catch { /* not JSON, that's ok */ }

  return {
    status: 'success',
    statusCode: response.status,
    responseTime,
    responseHeaders,
    models,
    modelCount,
    rawResponse,
    testedAt: Date.now(),
  };
}

// 2. 余额查询

async function queryBalance(config: ApiConfig, base: string): Promise<BalanceInfo> {
  try {
    switch (config.type) {
      case 'openai':
      case 'custom':
        return await queryOpenAIBalance(config, base);
      case 'anthropic':
        return { supported: false, error: 'Anthropic 暂不提供余额查询 API' };
      case 'google':
        return { supported: false, error: 'Google AI 暂不提供余额查询 API' };
      case 'azure':
        return { supported: false, error: 'Azure 需通过 Azure Portal 查看用量' };
      default:
        return await queryOpenAIBalance(config, base);
    }
  } catch (e: any) {
    return { supported: false, error: e.message };
  }
}

/**
 * OpenAI / 兼容接口余额查询
 * 依次尝试多个已知端点
 */
async function queryOpenAIBalance(config: ApiConfig, base: string): Promise<BalanceInfo> {
  const headers = buildHeaders(config);

  // 端点优先级列表（不同平台差异较大）
  // 只保留最常用的 4 个，避免太多无效请求
  const endpoints = [
    `${base}/v1/dashboard/billing/subscription`,
    `${base}/v1/dashboard/billing/usage`,
    `${base}/v1/user/info`,
    `${base}/v1/account/balance`,
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 5000); // 减少到 5 秒

      const resp = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal as any,
      });
      clearTimeout(tid);

      if (!resp.ok) continue;

      const text = await resp.text();
      let json: any;
      try { json = JSON.parse(text); } catch { continue; }

      const parsed = parseBalanceResponse(json, url);
      if (parsed) return { supported: true, ...parsed, raw: json };
    } catch { /* try next */ }
  }

  return { supported: false, error: '未找到余额查询端点（该 API 可能不支持余额查询）' };
}

/**
 * 解析各种格式的余额响应
 */
function parseBalanceResponse(json: any, url: string): Omit<BalanceInfo, 'supported' | 'raw'> | null {
  if (!json || typeof json !== 'object') return null;

  // ── OpenAI 官方格式 ──
  // { hard_limit_usd, system_hard_limit_usd, has_payment_method }
  if (json.hard_limit_usd !== undefined || json.soft_limit_usd !== undefined) {
    return {
      total: json.hard_limit_usd ?? json.soft_limit_usd,
      unit: 'USD',
    };
  }

  // ── 部分中转站: { balance, currency } ──
  if (json.balance !== undefined) {
    return {
      remaining: typeof json.balance === 'number' ? json.balance : parseFloat(json.balance),
      unit: json.currency || json.unit || 'USD',
      total: json.total_balance ?? json.total,
    };
  }

  // ── { data: { balance, ... } } ──
  if (json.data?.balance !== undefined) {
    const d = json.data;
    return {
      remaining: typeof d.balance === 'number' ? d.balance : parseFloat(d.balance),
      unit: d.currency || d.unit || 'USD',
      total: d.total_balance ?? d.total,
    };
  }

  // ── { credits, credits_used } ──
  if (json.credits !== undefined || json.credits_used !== undefined) {
    const total = json.credits ?? json.total_credits;
    const used = json.credits_used ?? 0;
    return {
      remaining: total !== undefined ? (total - used) : undefined,
      total,
      used,
      unit: 'credits',
    };
  }

  // ── { total_available, total_granted } ──
  if (json.total_available !== undefined) {
    return {
      remaining: json.total_available,
      total: json.total_granted,
      unit: 'USD',
    };
  }

  // ── 用量格式 { total_usage }（OpenAI usage 端点）──
  if (json.total_usage !== undefined && url.includes('usage')) {
    return {
      used: json.total_usage / 100, // 单位是 cents
      unit: 'USD',
    };
  }

  // ── { code, data: { remaining_quota } } ──
  if (json.data?.remaining_quota !== undefined || json.data?.remainingQuota !== undefined) {
    const d = json.data;
    const remaining = d.remaining_quota ?? d.remainingQuota;
    return {
      remaining: typeof remaining === 'number' ? remaining : parseFloat(remaining),
      total: d.total_quota ?? d.totalQuota,
      unit: d.unit || 'tokens',
    };
  }

  // ── { code, message, data: ... } 通用包装 ──
  if ((json.code === 0 || json.code === 200 || json.success === true) && json.data) {
    return parseBalanceResponse(json.data, url);
  }

  return null;
}

// 3. 速率限制（解析响应头）

function parseRateLimitHeaders(headers: Record<string, string>): RateLimitInfo | undefined {
  const info: RateLimitInfo = {};
  let hasAny = false;

  const getNum = (key: string) => {
    const v = headers[key];
    if (!v) return undefined;
    const n = parseInt(v, 10);
    return isNaN(n) ? undefined : n;
  };

  // OpenAI 标准头
  const rpm = getNum('x-ratelimit-limit-requests');
  const tpm = getNum('x-ratelimit-limit-tokens');
  const rpd = getNum('x-ratelimit-limit-requests-per-day') ?? getNum('x-ratelimit-requests-per-day');
  const remReq = getNum('x-ratelimit-remaining-requests');
  const remTok = getNum('x-ratelimit-remaining-tokens');
  const reset = headers['x-ratelimit-reset-requests'] || headers['x-ratelimit-reset'];

  if (rpm !== undefined) { info.requestsPerMinute = rpm; hasAny = true; }
  if (tpm !== undefined) { info.tokensPerMinute = tpm; hasAny = true; }
  if (rpd !== undefined) { info.requestsPerDay = rpd; hasAny = true; }
  if (remReq !== undefined) { info.remainingRequests = remReq; hasAny = true; }
  if (remTok !== undefined) { info.remainingTokens = remTok; hasAny = true; }
  if (reset) { info.resetAt = reset; hasAny = true; }

  // retry-after 也算
  const retryAfter = headers['retry-after'];
  if (retryAfter && !reset) { info.resetAt = `${retryAfter}s`; hasAny = true; }

  return hasAny ? info : undefined;
}

// 4. 对话可用性测试

async function testChatAvailability(config: ApiConfig, base: string): Promise<ChatTestResult> {
  const start = Date.now();
  try {
    switch (config.type) {
      case 'openai':
      case 'custom':
      case 'other':
        return await testOpenAIChat(config, base, start);
      case 'anthropic':
        return await testAnthropicChat(config, base, start);
      case 'google':
        return await testGoogleChat(config, base, start);
      case 'azure':
        return { available: false, error: 'Azure 需要 deployment 名称，跳过对话测试' };
      default:
        return await testOpenAIChat(config, base, start);
    }
  } catch (e: any) {
    return { available: false, responseTime: Date.now() - start, error: e.message };
  }
}

async function testOpenAIChat(config: ApiConfig, base: string, start: number): Promise<ChatTestResult> {
  // 先从模型列表中选第一个可用模型
  const model = await pickFirstModel(config, base) || 'gpt-3.5-turbo';

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 20000);

  try {
    const resp = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { ...buildHeaders(config) },
      body: JSON.stringify({
        model,  // 使用获取到的第一个模型
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
        stream: false,
      }),
      signal: controller.signal as any,
    });
    clearTimeout(tid);

    const responseTime = Date.now() - start;
    const text = await resp.text();
    let json: any;
    try { json = JSON.parse(text); } catch { /* not JSON */ }

    // 401/403 通常是模型不存在，换用 gpt-3.5-turbo 重试
    if (!resp.ok && (resp.status === 401 || resp.status === 403)) {
      const fallbackModel = 'gpt-3.5-turbo';
      const retryResp = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { ...buildHeaders(config) },
        body: JSON.stringify({
          model: fallbackModel,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
          stream: false,
        }),
        signal: controller.signal as any,
      });

      if (retryResp.ok) {
        const retryJson = await retryResp.json().catch(() => ({}));
        const content = retryJson?.choices?.[0]?.message?.content ?? '';
        return {
          available: true,
          model: fallbackModel,
          responseTime: Date.now() - start,
          content: content.trim(),
          totalTokens: retryJson?.usage?.total_tokens,
          note: `原模型 "${model}" 不支持，使用默认模型`,
        };
      }
      // 重试也失败，返回原始错误
      return {
        available: false,
        model,
        responseTime,
        error: `HTTP ${resp.status}: ${json?.error?.message || text.substring(0, 200)}`,
      };
    }

    if (!resp.ok) {
      return {
        available: false,
        model,
        responseTime,
        error: `HTTP ${resp.status}: ${json?.error?.message || text.substring(0, 200)}`,
      };
    }

    const content = json?.choices?.[0]?.message?.content ?? json?.choices?.[0]?.text ?? '';
    const totalTokens = json?.usage?.total_tokens;

    return { available: true, model, responseTime, content: content.trim(), totalTokens };
  } catch (e: any) {
    clearTimeout(tid);
    return { available: false, responseTime: Date.now() - start, error: e.message };
  }
}

async function testAnthropicChat(config: ApiConfig, base: string, start: number): Promise<ChatTestResult> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 20000);

  try {
    const resp = await fetch(`${base}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
      signal: controller.signal as any,
    });
    clearTimeout(tid);

    const responseTime = Date.now() - start;
    const json = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return { available: false, responseTime, error: json?.error?.message || `HTTP ${resp.status}` };
    }

    const content = json?.content?.[0]?.text ?? '';
    const totalTokens = (json?.usage?.input_tokens ?? 0) + (json?.usage?.output_tokens ?? 0);

    return { available: true, model: json?.model, responseTime, content, totalTokens };
  } catch (e: any) {
    clearTimeout(tid);
    return { available: false, responseTime: Date.now() - start, error: e.message };
  }
}

async function testGoogleChat(config: ApiConfig, base: string, start: number): Promise<ChatTestResult> {
  const model = 'gemini-pro';
  const url = `${base}/v1/models/${model}:generateContent?key=${config.apiKey}`;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 20000);

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] }),
      signal: controller.signal as any,
    });
    clearTimeout(tid);

    const responseTime = Date.now() - start;
    const json = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return { available: false, responseTime, error: json?.error?.message || `HTTP ${resp.status}` };
    }

    const content = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return { available: true, model, responseTime, content };
  } catch (e: any) {
    clearTimeout(tid);
    return { available: false, responseTime: Date.now() - start, error: e.message };
  }
}

// 5. 延迟测速

async function measureLatency(config: ApiConfig, base: string, rounds: number): Promise<LatencyResult> {
  const url = buildModelsUrl(config, base);
  const headers = buildHeaders(config);
  const samples: number[] = [];

  for (let i = 0; i < rounds; i++) {
    const t = Date.now();
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 8000);
      await fetch(url, { method: 'GET', headers, signal: controller.signal as any });
      clearTimeout(tid);
      samples.push(Date.now() - t);
    } catch {
      samples.push(8000); // 超时记为 8000ms
    }
    // 增加间隔到 500ms 避免被限速
    if (i < rounds - 1) await sleep(500);
  }

  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);

  // 稳定性 = 1 - (标准差 / 均值)，映射到 0-100
  const variance = samples.reduce((s, v) => s + (v - avg) ** 2, 0) / samples.length;
  const stddev = Math.sqrt(variance);
  const stability = Math.max(0, Math.round((1 - stddev / Math.max(avg, 1)) * 100));

  return { min, max, avg, samples, stability };
}

// 6. Key 错误类型识别

function detectKeyError(statusCode?: number, errorMessage?: string): KeyErrorType {
  const msg = (errorMessage || '').toLowerCase();

  if (statusCode === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'rate_limited';
  }
  if (statusCode === 401) {
    if (msg.includes('expired') || msg.includes('过期')) return 'expired';
    if (msg.includes('invalid') || msg.includes('incorrect') || msg.includes('无效')) return 'invalid_key';
    return 'unauthorized';
  }
  if (statusCode === 403) {
    if (msg.includes('insufficient') || msg.includes('余额') || msg.includes('quota') || msg.includes('balance')) {
      return 'insufficient';
    }
    return 'permission';
  }
  if (msg.includes('insufficient') || msg.includes('quota exceeded') || msg.includes('余额不足')) {
    return 'insufficient';
  }
  if (msg.includes('expired') || msg.includes('过期')) return 'expired';
  if (msg.includes('invalid') || msg.includes('无效')) return 'invalid_key';

  return 'unknown';
}

// 工具函数

/** 选取第一个可用模型 */
async function pickFirstModel(config: ApiConfig, base: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(buildModelsUrl(config, base), {
      headers: buildHeaders(config),
      signal: controller.signal as any,
    });
    clearTimeout(tid);
    if (!resp.ok) return null;
    const json = await resp.json();
    const models = extractModels(json, config.type);
    return models[0] ?? null;
  } catch {
    return null;
  }
}

/** 构建 /models 测试 URL */
function buildModelsUrl(config: ApiConfig, base: string): string {
  switch (config.type) {
    case 'openai':
    case 'custom':
    case 'other':
      return `${base}/models`;
    case 'anthropic':
      return `${base}/v1/models`;
    case 'google':
      return `${base}/v1/models?key=${config.apiKey}`;
    case 'azure':
      return `${base}`;
    default:
      return `${base}/models`;
  }
}

/** 构建请求头 */
function buildHeaders(config: ApiConfig): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  switch (config.type) {
    case 'openai':
    case 'custom':
    case 'other':
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      break;
    case 'anthropic':
      headers['x-api-key'] = config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      break;
    case 'google':
      // Google 使用 URL 参数
      break;
    case 'azure':
      headers['api-key'] = config.apiKey;
      break;
    default:
      headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  return headers;
}

/** 从响应 JSON 中提取模型列表 */
function extractModels(json: any, _apiType: string): string[] {
  try {
    if (json.data && Array.isArray(json.data)) {
      return json.data.map((item: any) => item.id || item.name || '').filter(Boolean);
    }
    if (json.models && Array.isArray(json.models)) {
      return json.models.map((item: any) => item.name?.replace('models/', '') || '').filter(Boolean);
    }
    if (Array.isArray(json)) {
      return json.map((item: any) => item.id || item.name || item || '').filter(Boolean).map(String);
    }
    return [];
  } catch {
    return [];
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 批量测试

/**
 * 并行测试多个 API（逐个执行，避免浏览器并发限制）
 */
export async function testApisBatch(
  configs: ApiConfig[],
  onProgress?: (results: TestResult[], completed: number, total: number) => void
): Promise<TestResult[]> {
  const results: TestResult[] = configs.map(config => ({
    apiId: config.id,
    status: 'testing' as const,
  }));

  if (onProgress) onProgress([...results], 0, configs.length);

  for (let i = 0; i < configs.length; i++) {
    results[i] = await testApiConnectivity(configs[i]);
    if (onProgress) onProgress([...results], i + 1, configs.length);
  }

  return results;
}
