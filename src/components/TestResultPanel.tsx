/**
 * 测试结果展示面板组件
 * 显示批量测试的整体结果摘要和详细结果
 */

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  HourglassEmpty as TestingIcon,
  Help as UntestedIcon,
} from '@mui/icons-material';
import { TestResult } from '../types';

interface TestResultPanelProps {
  /** 所有测试结果 */
  results: Record<string, TestResult>;
  /** 正在批量测试中 */
  batchTesting: boolean;
  /** 批量测试进度 */
  progress: { completed: number; total: number };
  /** 所有 API 配置（用于显示名称） */
  configs: { id: string; name: string; baseUrl: string }[];
}

const TestResultPanel: React.FC<TestResultPanelProps> = ({
  results,
  batchTesting,
  progress,
  configs,
}) => {
  const resultList = Object.values(results);

  // 统计数据
  const stats = {
    total: resultList.length,
    success: resultList.filter(r => r.status === 'success').length,
    error: resultList.filter(r => r.status === 'error').length,
    testing: resultList.filter(r => r.status === 'testing').length,
    untested: resultList.filter(r => r.status === 'untested').length,
  };

  // 是否显示面板
  const hasResults = resultList.length > 0;

  if (!hasResults && !batchTesting) {
    return null;
  }

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        测试结果概览
      </Typography>

      {/* 进度条 */}
      {batchTesting && (
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" color="text.secondary">
              测试进度
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {progress.completed} / {progress.total}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}

      {/* 统计数字 */}
      <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
        <Chip
          icon={<UntestedIcon />}
          label={`未测试：${stats.untested}`}
          variant="outlined"
        />
        <Chip
          icon={<TestingIcon />}
          label={`测试中：${stats.testing}`}
          color="info"
          variant={stats.testing > 0 ? 'filled' : 'outlined'}
        />
        <Chip
          icon={<SuccessIcon />}
          label={`成功：${stats.success}`}
          color="success"
          variant={stats.success > 0 ? 'filled' : 'outlined'}
        />
        <Chip
          icon={<ErrorIcon />}
          label={`失败：${stats.error}`}
          color="error"
          variant={stats.error > 0 ? 'filled' : 'outlined'}
        />
      </Box>

      {/* 详细结果列表 */}
      {hasResults && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" gutterBottom>
            详细信息
          </Typography>
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {configs.map(config => {
              const result = results[config.id];
              if (!result) return null;

              return (
                <Box
                  key={config.id}
                  display="flex"
                  alignItems="center"
                  gap={1}
                  py={0.5}
                  borderBottom={1}
                  borderColor="divider"
                >
                  {result.status === 'success' && <SuccessIcon color="success" fontSize="small" />}
                  {result.status === 'error' && <ErrorIcon color="error" fontSize="small" />}
                  {result.status === 'testing' && <TestingIcon color="info" fontSize="small" />}
                  {result.status === 'untested' && <UntestedIcon color="disabled" fontSize="small" />}

                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    <strong>{config.name}</strong>
                    <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                      {config.baseUrl}
                    </Typography>
                  </Typography>

                  {result.responseTime !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      {result.responseTime}ms
                    </Typography>
                  )}

                  {result.modelCount !== undefined && (
                    <Chip label={`${result.modelCount} 模型`} size="small" />
                  )}

                  {result.errorMessage && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={result.errorMessage}
                    >
                      {result.errorMessage.substring(0, 50)}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default TestResultPanel;
