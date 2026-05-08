/**
 * 常量定义
 * API 类型选项、默认值等
 */

import { ApiType } from '../types';

/** API 类型选项（用于下拉选择） */
export const API_TYPE_OPTIONS: { value: ApiType; label: string }[] = [
  { value: 'openai', label: 'OpenAI Compatible' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google AI' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'custom', label: '自定义中转站' },
  { value: 'other', label: '其他' },
];

/** 默认 API 类型 */
export const DEFAULT_API_TYPE: ApiType = 'openai';

/** localStorage 存储键名 */
export const STORAGE_KEY = 'api-tester-configs';

/** 测试超时时间（毫秒） */
export const TEST_TIMEOUT_MS = 30000;

/** 并行测试最大并发数 */
export const MAX_CONCURRENT_TESTS = 3;
