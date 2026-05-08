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
  /** 原始响应内容（用于详情查看） */
  rawResponse?: string;
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
