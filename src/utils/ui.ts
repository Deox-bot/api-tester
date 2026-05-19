/**
 * UI 工具函数
 * 提取各组件共用的样式和逻辑
 */

import { KeyErrorType } from '../types';

/** 延迟等级颜色 */
export function latencyColor(ms: number): string {
  if (ms < 500) return '#4caf50';
  if (ms < 1500) return '#ff9800';
  return '#f44336';
}

/** 稳定性评分颜色 */
export function stabilityColor(score: number): string {
  if (score >= 80) return '#4caf50';
  if (score >= 50) return '#ff9800';
  return '#f44336';
}

/** HTTP 状态码颜色 */
export function statusCodeColor(code?: number): string {
  if (!code) return '#9e9e9e';
  if (code < 300) return '#4caf50';
  if (code < 400) return '#2196f3';
  if (code < 500) return '#ff9800';
  return '#f44336';
}

/** Key 错误类型标签（组件用） */
export const KEY_ERROR_LABELS: Record<KeyErrorType, { label: string; color: 'error' | 'warning' }> = {
  expired:      { label: 'Key 已过期', color: 'error' },
  insufficient: { label: '余额不足', color: 'warning' },
  unauthorized: { label: 'Key 无效/未授权', color: 'error' },
  rate_limited: { label: '速率限制', color: 'warning' },
  permission:   { label: '权限不足', color: 'warning' },
  invalid_key:  { label: 'Key 格式错误', color: 'error' },
  unknown:      { label: '未知错误', color: 'error' },
};

/** Key 错误类型标签（详情对话框用，带颜色） */
export const KEY_ERROR_LABELS_DETAIL: Record<KeyErrorType, { label: string; color: string; bg: string }> = {
  expired:      { label: 'Key 已过期',       color: '#f44336', bg: '#ffebee' },
  insufficient: { label: '余额不足',         color: '#ff9800', bg: '#fff3e0' },
  unauthorized: { label: 'Key 无效/未授权',  color: '#f44336', bg: '#ffebee' },
  rate_limited: { label: '速率限制',         color: '#ff9800', bg: '#fff3e0' },
  permission:   { label: '权限不足',          color: '#ff9800', bg: '#fff3e0' },
  invalid_key:  { label: 'Key 格式错误',     color: '#f44336', bg: '#ffebee' },
  unknown:      { label: '未知错误',          color: '#9e9e9e', bg: '#f5f5f5' },
};

/** 代码块通用样式 */
export const preStyle = {
  maxHeight: 200,
  overflow: 'auto',
  p: 1,
  bgcolor: 'action.hover',
  borderRadius: 1,
  fontSize: '0.72rem',
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-all' as const,
  m: 0,
};
