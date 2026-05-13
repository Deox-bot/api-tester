/**
 * TypeScript 类型定义
 * 定义 API 配置、测试结果等核心数据结构
 */

/** API 类型枚举 */
export type ApiType = 'openai' | 'anthropic' | 'google' | 'azure' | 'custom' | 'other';

/** API 类型标签映射 */
export const API_TYPE_LABELS: Record<ApiType, string> = {
  openai: 'OpenAI Compatible',
  anthropic: 'Anthropic',
  google: 'Google',
  azure: 'Azure OpenAI',
  custom: '自定义中转站',
  other: '其他',
};

/** API 配置项 */
export interface ApiConfig {
  /** 唯一标识符 */
  id: string;
  /** 厂商/配置名称 */
  name: string;
  /** API Base URL */
  baseUrl: string;
  /** API Key */
  apiKey: string;
  /** API 类型 */
  type: ApiType;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/** 测试结果状态 */
export type TestStatus = 'untested' | 'testing' | 'success' | 'error';

/** Key 错误类型 */
export type KeyErrorType =
  | 'expired'        // Key 已过期
  | 'insufficient'   // 余额不足
  | 'unauthorized'   // 未授权/无效 Key
  | 'rate_limited'   // 速率限制
  | 'permission'     // 权限不足
  | 'invalid_key'    // Key 格式错误
  | 'unknown';       // 未知错误

/** 账户余额信息 */
export interface BalanceInfo {
  /** 是否支持余额查询 */
  supported: boolean;
  /** 剩余余额（美元或原始单位） */
  remaining?: number;
  /** 余额单位（如 'USD'、'CNY'、'tokens'） */
  unit?: string;
  /** 总额度 */
  total?: number;
  /** 已使用额度 */
  used?: number;
  /** 过期时间 */
  expiresAt?: string;
  /** 原始返回数据 */
  raw?: any;
  /** 错误信息 */
  error?: string;
}

/** 速率限制信息 */
export interface RateLimitInfo {
  /** 每分钟请求数限制 */
  requestsPerMinute?: number;
  /** 每分钟 Token 数限制 */
  tokensPerMinute?: number;
  /** 每天请求数限制 */
  requestsPerDay?: number;
  /** 剩余请求数 */
  remainingRequests?: number;
  /** 剩余 Token 数 */
  remainingTokens?: number;
  /** 重置时间 */
  resetAt?: string;
}

/** 对话可用性测试结果 */
export interface ChatTestResult {
  /** 是否可用 */
  available: boolean;
  /** 使用的模型 */
  model?: string;
  /** 响应时间 */
  responseTime?: number;
  /** 响应内容摘要 */
  content?: string;
  /** 消耗的 Token 数 */
  totalTokens?: number;
  /** 错误信息 */
  error?: string;
  /** 备注信息 */
  note?: string;
}

/** 延迟测速结果 */
export interface LatencyResult {
  /** 最小延迟 */
  min: number;
  /** 最大延迟 */
  max: number;
  /** 平均延迟 */
  avg: number;
  /** 各次延迟 */
  samples: number[];
  /** 稳定性评分 0-100 */
  stability: number;
}

/** 单个 API 测试结果 */
export interface TestResult {
  /** 所属 API 配置 ID */
  apiId: string;
  /** 测试状态 */
  status: TestStatus;
  /** HTTP 状态码 */
  statusCode?: number;
  /** 响应时间（毫秒） */
  responseTime?: number;
  /** 返回的模型列表 */
  models?: string[];
  /** 模型数量 */
  modelCount?: number;
  /** 错误信息 */
  errorMessage?: string;
  /** Key 错误类型（错误时细分原因） */
  keyErrorType?: KeyErrorType;
  /** 原始响应内容（用于详情查看） */
  rawResponse?: string;
  /** 响应头信息 */
  responseHeaders?: Record<string, string>;
  /** 账户余额信息 */
  balance?: BalanceInfo;
  /** 速率限制信息 */
  rateLimit?: RateLimitInfo;
  /** 对话可用性测试结果 */
  chatTest?: ChatTestResult;
  /** 延迟测速结果 */
  latency?: LatencyResult;
  /** 测试完成时间 */
  testedAt?: number;
}

/** 批量导入的 API 数据格式 */
export interface ImportApiConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  type: ApiType;
  remark?: string;
}

/** 主题模式 */
export type ThemeMode = 'light' | 'dark';
