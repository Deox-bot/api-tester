/**
 * API 测试工具函数
 * 负责发送测试请求、解析响应、处理错误
 */

import { ApiConfig, TestResult } from '../types';
import { TEST_TIMEOUT_MS } from '../constants';

/**
 * 测试单个 API 的连通性
 * @param config API 配置
 * @returns 测试结果
 */
export async function testApiConnectivity(config: ApiConfig): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    apiId: config.id,
    status: 'testing',
  };

  try {
    // 构建测试 URL（对于 OpenAI 兼容接口，测试 /models 端点）
    const testUrl = buildTestUrl(config);
    const headers = buildHeaders(config);

    // 设置超时
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
      
      // 处理 CORS 错误
      if (fetchError.message?.includes('Failed to fetch') || fetchError.message?.includes('NetworkError')) {
        return {
          ...result,
          status: 'error',
          statusCode: undefined,
          responseTime: Date.now() - startTime,
          errorMessage: '网络请求失败，可能是 CORS 限制或网络不可用。请在允许跨域的环境中测试，或确认 API 地址正确。',
          testedAt: Date.now(),
        };
      }

      // 处理超时
      if (fetchError.name === 'AbortError') {
        return {
          ...result,
          status: 'error',
          responseTime: TEST_TIMEOUT_MS,
          errorMessage: `请求超时（${TEST_TIMEOUT_MS / 1000}秒）`,
          testedAt: Date.now(),
        };
      }

      throw fetchError;
    }

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // 读取响应文本
    let responseText: string;
    try {
      responseText = await response.text();
    } catch {
      responseText = '';
    }

    // 解析模型列表
    let models: string[] = [];
    let modelCount = 0;
    let rawResponse = responseText;

    if (response.ok) {
      try {
        const json = JSON.parse(responseText);
        models = extractModels(json, config.type);
        modelCount = models.length;
      } catch {
        // 响应不是有效 JSON，但仍然视为成功（状态码正确）
        rawResponse = responseText.substring(0, 2000);
      }
    }

    if (!response.ok) {
      return {
        ...result,
        status: 'error',
        statusCode: response.status,
        responseTime,
        errorMessage: `HTTP ${response.status}: ${response.statusText}\n${responseText.substring(0, 500)}`,
        rawResponse,
        testedAt: Date.now(),
      };
    }

    return {
      ...result,
      status: 'success',
      statusCode: response.status,
      responseTime,
      models,
      modelCount,
      rawResponse,
      testedAt: Date.now(),
    };
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

/**
 * 根据 API 类型构建测试 URL
 */
function buildTestUrl(config: ApiConfig): string {
  const base = config.baseUrl.replace(/\/+$/, '');

  switch (config.type) {
    case 'openai':
    case 'custom':
      // OpenAI 兼容接口，测试 /models 端点
      return `${base}/models`;
    case 'anthropic':
      // Anthropic 没有公开的 models 端点，尝试发送一个最小请求到 messages
      return `${base}/v1/messages`;
    case 'google':
      // Google AI - 列出模型
      return `${base}/v1/models?key=${config.apiKey}`;
    case 'azure':
      // Azure OpenAI - 需要 deployment 名称，这里只测试基础连通性
      return `${base}`;
    default:
      // 默认尝试 /models
      return `${base}/models`;
  }
}

/**
 * 根据 API 类型构建请求头
 */
function buildHeaders(config: ApiConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  switch (config.type) {
    case 'openai':
    case 'custom':
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      break;
    case 'anthropic':
      headers['x-api-key'] = config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      break;
    case 'google':
      // Google 使用 URL 参数传递 key
      break;
    case 'azure':
      headers['api-key'] = config.apiKey;
      break;
    default:
      headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  return headers;
}

/**
 * 从响应 JSON 中提取模型列表
 */
function extractModels(json: any, _apiType: string): string[] {
  try {
    // OpenAI 兼容格式: { data: [{ id: "model-name" }] }
    if (json.data && Array.isArray(json.data)) {
      return json.data
        .map((item: any) => item.id || item.name || '')
        .filter(Boolean);
    }

    // Google 格式: { models: [{ name: "models/model-name" }] }
    if (json.models && Array.isArray(json.models)) {
      return json.models
        .map((item: any) => item.name?.replace('models/', '') || '')
        .filter(Boolean);
    }

    // 直接是数组
    if (Array.isArray(json)) {
      return json
        .map((item: any) => item.id || item.name || item || '')
        .filter(Boolean)
        .map(String);
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * 并行测试多个 API（限制并发数）
 * @param configs API 配置列表
 * @param onProgress 进度回调
 * @returns 测试结果列表
 */
export async function testApisBatch(
  configs: ApiConfig[],
  onProgress?: (results: TestResult[], completed: number, total: number) => void
): Promise<TestResult[]> {
  const results: TestResult[] = configs.map(config => ({
    apiId: config.id,
    status: 'testing' as const,
  }));

  // 初始化结果
  if (onProgress) {
    onProgress([...results], 0, configs.length);
  }

  // 逐个测试（避免浏览器并发限制）
  for (let i = 0; i < configs.length; i++) {
    const result = await testApiConnectivity(configs[i]);
    results[i] = result;

    if (onProgress) {
      onProgress([...results], i + 1, configs.length);
    }
  }

  return results;
}
