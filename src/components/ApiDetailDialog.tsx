/**
 * API 详情对话框组件
 * 完整展示 API 配置与测试结果的各个维度信息
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Help as UntestedIcon,
  AccountBalanceWallet as WalletIcon,
  Chat as ChatIcon,
  NetworkCheck as LatencyIcon,
  Speed as SpeedIcon,
  Code as CodeIcon,
  Storage as HeadersIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  ApiConfig,
  TestResult,
  API_TYPE_LABELS,
  ApiType,
  KeyErrorType,
} from '../types';

interface ApiDetailDialogProps {
  open: boolean;
  config: ApiConfig | null;
  testResult?: TestResult;
  onClose: () => void;
}

/** Key 错误类型标签 */
const KEY_ERROR_LABELS: Record<KeyErrorType, { label: string; color: string; bg: string }> = {
  expired:      { label: 'Key 已过期',       color: '#f44336', bg: '#ffebee' },
  insufficient: { label: '余额不足',         color: '#ff9800', bg: '#fff3e0' },
  unauthorized: { label: 'Key 无效/未授权',  color: '#f44336', bg: '#ffebee' },
  rate_limited: { label: '速率限制',         color: '#ff9800', bg: '#fff3e0' },
  permission:   { label: '权限不足',          color: '#ff9800', bg: '#fff3e0' },
  invalid_key:  { label: 'Key 格式错误',     color: '#f44336', bg: '#ffebee' },
  unknown:      { label: '未知错误',          color: '#9e9e9e', bg: '#f5f5f5' },
};

/** 延迟颜色 */
function latencyColor(ms: number): string {
  if (ms < 500) return '#4caf50';
  if (ms < 1500) return '#ff9800';
  return '#f44336';
}

/** 稳定性颜色 */
function stabilityColor(score: number): string {
  if (score >= 80) return '#4caf50';
  if (score >= 50) return '#ff9800';
  return '#f44336';
}

/** HTTP 状态码颜色 */
function statusCodeColor(code?: number): string {
  if (!code) return '#9e9e9e';
  if (code >= 200 && code < 300) return '#4caf50';
  if (code >= 400) return '#f44336';
  return '#ff9800';
}

const ApiDetailDialog: React.FC<ApiDetailDialogProps> = ({
  open,
  config,
  testResult,
  onClose,
}) => {
  if (!config) return null;

  const status = testResult?.status || 'untested';

  // 格式化时间戳
  const formatTime = (ts?: number) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleString('zh-CN');
  };

  // 格式化 JSON
  const formatJson = (str?: string) => {
    if (!str) return '-';
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider',
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h6" fontWeight="bold">API 详情</Typography>
          {/* 状态标签 */}
          {status === 'success' && <Chip icon={<SuccessIcon />} label="测试成功" color="success" size="small" />}
          {status === 'error' && <Chip icon={<ErrorIcon />} label="测试失败" color="error" size="small" />}
          {status === 'testing' && <Chip icon={<SpeedIcon />} label="测试中" color="info" size="small" />}
          {status === 'untested' && <Chip icon={<UntestedIcon />} label="未测试" variant="outlined" size="small" />}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* 测试进度条 */}
        {status === 'testing' && (
          <LinearProgress sx={{ borderRadius: 0 }} />
        )}

        <Box p={3} sx={{ overflowY: 'auto', maxHeight: 'calc(90vh - 80px)' }}>

          {/* ── 第一行：基础信息 + 测试摘要 ── */}
          <Grid container spacing={2} mb={2}>
            {/* 基础信息卡片 */}
            <Grid item xs={12} md={6}>
              <InfoCard title="基础信息" icon={<CodeIcon />}>
                <DetailRow label="名称" value={config.name} />
                <DetailRow label="类型" value={API_TYPE_LABELS[config.type as ApiType] || config.type} />
                <DetailRow label="Base URL" value={config.baseUrl} mono />
                <DetailRow
                  label="API Key"
                  value={
                    <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                      {config.apiKey ? `${config.apiKey.slice(0, 8)}...${config.apiKey.slice(-4)}` : '-'}
                    </Box>
                  }
                />
                {config.remark && <DetailRow label="备注" value={config.remark} />}
                <DetailRow label="创建时间" value={formatTime(config.createdAt)} />
                <DetailRow label="更新时间" value={formatTime(config.updatedAt)} />
              </InfoCard>
            </Grid>

            {/* 测试摘要卡片 */}
            <Grid item xs={12} md={6}>
              <InfoCard title="测试摘要" icon={<SpeedIcon />}>
                <DetailRow
                  label="HTTP 状态"
                  value={
                    testResult?.statusCode
                      ? <Chip label={`${testResult.statusCode}`} size="small" sx={{ bgcolor: statusCodeColor(testResult.statusCode), color: '#fff' }} />
                      : <Typography component="span" variant="body2" color="text.disabled">-</Typography>
                  }
                />
                <DetailRow
                  label="响应时间"
                  value={
                    testResult?.responseTime !== undefined
                      ? <Typography component="span" sx={{ color: latencyColor(testResult.responseTime), fontWeight: 'bold' }}>
                          {testResult.responseTime}ms
                        </Typography>
                      : '-'
                  }
                />
                <DetailRow
                  label="模型数量"
                  value={testResult?.modelCount !== undefined ? `${testResult.modelCount} 个` : '-'}
                />
                <DetailRow
                  label="Key 状态"
                  value={
                    testResult?.keyErrorType && testResult.keyErrorType !== 'unknown'
                      ? (() => {
                          const err = KEY_ERROR_LABELS[testResult.keyErrorType];
                          return (
                            <Chip
                              icon={<WarningIcon sx={{ fontSize: 14 }} />}
                              label={err.label}
                              size="small"
                              sx={{ color: err.color, bgcolor: err.bg, borderColor: err.color }}
                              variant="outlined"
                            />
                          );
                        })()
                      : testResult?.keyErrorType === 'unknown'
                        ? <Chip label="未知" size="small" variant="outlined" />
                        : <Typography component="span" variant="body2" color="text.disabled">正常 / 未测试</Typography>
                  }
                />
                <DetailRow label="测试时间" value={formatTime(testResult?.testedAt)} />
              </InfoCard>
            </Grid>
          </Grid>

          {/* ── 余额信息 ── */}
          {testResult?.balance && (
            <SectionCard
              title="账户余额"
              icon={<WalletIcon />}
              defaultOpen={testResult.balance.supported}
            >
              {testResult.balance.supported ? (
                <Box>
                  <Grid container spacing={2}>
                    {testResult.balance.remaining !== undefined && (
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">剩余</Typography>
                        <Typography variant="h6" color="success.main" fontWeight="bold">
                          {testResult.balance.remaining.toFixed(4)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{testResult.balance.unit || 'USD'}</Typography>
                      </Grid>
                    )}
                    {testResult.balance.total !== undefined && (
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">总额度</Typography>
                        <Typography variant="h6">{testResult.balance.total.toFixed(2)}</Typography>
                        <Typography variant="caption" color="text.secondary">{testResult.balance.unit || 'USD'}</Typography>
                      </Grid>
                    )}
                    {testResult.balance.used !== undefined && (
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary">已使用</Typography>
                        <Typography variant="h6" color="error.main">{testResult.balance.used.toFixed(4)}</Typography>
                        <Typography variant="caption" color="text.secondary">{testResult.balance.unit || 'USD'}</Typography>
                      </Grid>
                    )}
                  </Grid>
                  {testResult.balance.raw && (
                    <Box mt={2}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>原始数据</Typography>
                      <Box component="pre" sx={preStyle}>
                        {JSON.stringify(testResult.balance.raw, null, 2)}
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {testResult.balance.error || '不支持余额查询'}
                </Typography>
              )}
            </SectionCard>
          )}

          {/* ── 对话可用性测试 ── */}
          {testResult?.chatTest && (
            <SectionCard title="对话可用性测试" icon={<ChatIcon />} defaultOpen={testResult.chatTest.available}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="text.secondary">状态</Typography>
                  <Box mt={0.5}>
                    {testResult.chatTest.available
                      ? <Chip label="可用" color="success" size="small" />
                      : <Chip label="不可用" color="error" size="small" />
                    }
                  </Box>
                </Grid>
                {testResult.chatTest.model && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">使用模型</Typography>
                    <Typography variant="body2" fontWeight="bold" fontFamily="monospace">
                      {testResult.chatTest.model}
                    </Typography>
                  </Grid>
                )}
                {testResult.chatTest.responseTime !== undefined && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">响应时间</Typography>
                    <Typography variant="body2" sx={{ color: latencyColor(testResult.chatTest.responseTime), fontWeight: 'bold' }}>
                      {testResult.chatTest.responseTime}ms
                    </Typography>
                  </Grid>
                )}
                {testResult.chatTest.totalTokens !== undefined && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">消耗 Tokens</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {testResult.chatTest.totalTokens}
                    </Typography>
                  </Grid>
                )}
              </Grid>
              {testResult.chatTest.content && (
                <Box mt={2}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>AI 回复</Typography>
                  <Box sx={{ ...preStyle, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    {testResult.chatTest.content}
                  </Box>
                </Box>
              )}
              {testResult.chatTest.error && (
                <Box mt={2} p={1} bgcolor="error.light" borderRadius={1}>
                  <Typography variant="caption" color="error.contrastText" fontWeight={600}>错误信息</Typography>
                  <Typography variant="body2" color="error.contrastText">
                    {testResult.chatTest.error}
                  </Typography>
                </Box>
              )}
              {/* 完整 JSON */}
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>完整数据</Typography>
                <Box component="pre" sx={preStyle}>
                  {JSON.stringify(testResult.chatTest, null, 2)}
                </Box>
              </Box>
            </SectionCard>
          )}

          {/* ── 延迟测速 ── */}
          {testResult?.latency && (
            <SectionCard title="延迟测速（3 次）" icon={<LatencyIcon />} defaultOpen>
              <Grid container spacing={2} mb={1}>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">最低</Typography>
                  <Typography variant="h6" sx={{ color: latencyColor(testResult.latency.min) }}>
                    {testResult.latency.min}ms
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">平均</Typography>
                  <Typography variant="h6" sx={{ color: latencyColor(testResult.latency.avg), fontWeight: 'bold' }}>
                    {testResult.latency.avg}ms
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">最高</Typography>
                  <Typography variant="h6" sx={{ color: latencyColor(testResult.latency.max) }}>
                    {testResult.latency.max}ms
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">稳定性</Typography>
                  <Typography variant="h6" sx={{ color: stabilityColor(testResult.latency.stability), fontWeight: 'bold' }}>
                    {testResult.latency.stability}%
                  </Typography>
                </Grid>
              </Grid>
              {/* 样本详情 */}
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>次数</TableCell>
                      <TableCell align="right">延迟</TableCell>
                      <TableCell align="right">评级</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {testResult.latency.samples.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell>第 {i + 1} 次</TableCell>
                        <TableCell align="right" sx={{ color: latencyColor(s), fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {s}ms
                        </TableCell>
                        <TableCell align="right">
                          {s < 500 ? <Chip label="优秀" color="success" size="small" /> :
                           s < 1500 ? <Chip label="良好" color="warning" size="small" /> :
                           <Chip label="较慢" color="error" size="small" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </SectionCard>
          )}

          {/* ── 速率限制 ── */}
          {testResult?.rateLimit && (
            <SectionCard title="速率限制" icon={<SpeedIcon />}>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>限制项</TableCell>
                      <TableCell align="right">数值</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {testResult.rateLimit.requestsPerMinute !== undefined && (
                      <TableRow><TableCell>每分钟请求数</TableCell><TableCell align="right">{testResult.rateLimit.requestsPerMinute}</TableCell></TableRow>
                    )}
                    {testResult.rateLimit.tokensPerMinute !== undefined && (
                      <TableRow><TableCell>每分钟 Token 数</TableCell><TableCell align="right">{testResult.rateLimit.tokensPerMinute}</TableCell></TableRow>
                    )}
                    {testResult.rateLimit.requestsPerDay !== undefined && (
                      <TableRow><TableCell>每天请求数</TableCell><TableCell align="right">{testResult.rateLimit.requestsPerDay}</TableCell></TableRow>
                    )}
                    {testResult.rateLimit.remainingRequests !== undefined && (
                      <TableRow><TableCell>剩余请求次数</TableCell><TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>{testResult.rateLimit.remainingRequests}</TableCell></TableRow>
                    )}
                    {testResult.rateLimit.remainingTokens !== undefined && (
                      <TableRow><TableCell>剩余 Tokens</TableCell><TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>{testResult.rateLimit.remainingTokens}</TableCell></TableRow>
                    )}
                    {testResult.rateLimit.resetAt && (
                      <TableRow><TableCell>重置时间</TableCell><TableCell align="right">{testResult.rateLimit.resetAt}</TableCell></TableRow>
                    )}
                    {Object.keys(testResult.rateLimit).length === 0 && (
                      <TableRow><TableCell colSpan={2} align="center">无详细信息</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </SectionCard>
          )}

          {/* ── 模型列表 ── */}
          {testResult?.models && testResult.models.length > 0 && (
            <SectionCard title={`可用模型（${testResult.models.length} 个）`} icon={<CodeIcon />} defaultOpen>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, maxHeight: 300, overflowY: 'auto' }}>
                {testResult.models.map((model, i) => (
                  <Chip
                    key={i}
                    label={model}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}
                  />
                ))}
              </Box>
            </SectionCard>
          )}

          {/* ── 响应头 ── */}
          {testResult?.responseHeaders && Object.keys(testResult.responseHeaders).length > 0 && (
            <SectionCard title="响应头" icon={<HeadersIcon />}>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '40%' }}>Header</TableCell>
                      <TableCell>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(testResult.responseHeaders).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'primary.main' }}>
                          {key}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                          {value}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </SectionCard>
          )}

          {/* ── 原始响应 ── */}
          {testResult?.rawResponse && (
            <SectionCard title="原始响应" icon={<CodeIcon />}>
              <Box component="pre" sx={preStyle}>
                {formatJson(testResult.rawResponse)}
              </Box>
            </SectionCard>
          )}

          {/* ── 错误详情 ── */}
          {testResult?.errorMessage && (
            <SectionCard title="错误详情" icon={<ErrorIcon />} defaultOpen>
              <Box p={2} bgcolor="error.light" borderRadius={1}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {testResult.errorMessage}
                </Typography>
              </Box>
            </SectionCard>
          )}

          {/* 未测试状态 */}
          {status === 'untested' && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                尚未测试此 API
              </Typography>
              <Typography variant="body2" color="text.disabled">
                点击卡片上的「测试」按钮进行全量测试
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// 子组件

const preStyle = {
  maxHeight: 250,
  overflow: 'auto',
  p: 1.5,
  bgcolor: 'action.hover',
  borderRadius: 1,
  fontSize: '0.75rem',
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-all' as const,
  m: 0,
};

const InfoCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Box display="flex" alignItems="center" gap={0.75} mb={1.5}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="subtitle2" fontWeight="bold">{title}</Typography>
    </Box>
    <Box>{children}</Box>
  </Paper>
);

const DetailRow: React.FC<{
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}> = ({ label, value, mono }) => (
  <Box display="flex" mb={0.75}>
    <Typography variant="body2" sx={{ width: 90, flexShrink: 0, color: 'text.secondary', fontWeight: 600 }}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={mono ? { fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all' } : { wordBreak: 'break-all' }}
    >
      {value || '-'}
    </Typography>
  </Box>
);

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <Paper variant="outlined" sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={2}
        py={1.5}
        sx={{ cursor: 'pointer', bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}
        onClick={() => setOpen(!open)}
      >
        <Box display="flex" alignItems="center" gap={0.75}>
          <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
          <Typography variant="subtitle2" fontWeight="bold">{title}</Typography>
        </Box>
        <Button size="small" variant="text" sx={{ textTransform: 'none' }}>
          {open ? '收起' : '展开'}
        </Button>
      </Box>
      {open && <Box p={2}>{children}</Box>}
    </Paper>
  );
};

export default ApiDetailDialog;
