/**
 * API 卡片组件
 * 展示单个 API 配置的摘要信息，支持编辑、删除、测试操作
 */

import React, { useState } from 'react';
import {
  Card, CardContent, CardActions, Typography, Button, Chip,
  IconButton, Tooltip, Box, LinearProgress, Collapse, Divider,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Speed as TestIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Help as UntestedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  AccountBalanceWallet as WalletIcon,
  Chat as ChatIcon,
  NetworkCheck as LatencyIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  ApiConfig, TestResult, ApiType, API_TYPE_LABELS,
  TestStatus, BalanceInfo,
  ChatTestResult, LatencyResult, RateLimitInfo,
} from '../types';
import { latencyColor, stabilityColor, KEY_ERROR_LABELS, preStyle } from '../utils/ui';

interface ApiCardProps {
  config: ApiConfig;
  testResult?: TestResult;
  onEdit: (config: ApiConfig) => void;
  onDelete: (id: string) => void;
  onTest: (config: ApiConfig) => void;
  onShowDetail: (config: ApiConfig) => void;
}

/** 状态图标 */
const STATUS_ICON: Record<TestStatus, React.ReactNode> = {
  untested: <UntestedIcon color="disabled" fontSize="small" />,
  testing: <CircularProgress size={16} />,
  success: <SuccessIcon color="success" fontSize="small" />,
  error: <ErrorIcon color="error" fontSize="small" />,
};




const ApiCard: React.FC<ApiCardProps> = ({ config, testResult, onEdit, onDelete, onTest, onShowDetail }) => {
  const [expanded, setExpanded] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const status = testResult?.status || 'untested';

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(config.apiKey || '');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = config.apiKey || '';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const maskedKey = config.apiKey && config.apiKey.length > 8
    ? `${config.apiKey.slice(0, 4)}...${config.apiKey.slice(-4)}`
    : '****';

  const hasDetails =
    (testResult?.models?.length ?? 0) > 0 ||
    !!testResult?.rawResponse ||
    !!testResult?.balance ||
    !!testResult?.chatTest ||
    !!testResult?.latency ||
    !!testResult?.rateLimit ||
    (!!testResult?.responseHeaders && Object.keys(testResult.responseHeaders).length > 0);

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 6 },
        borderLeft: 4,
        borderColor:
          status === 'success' ? 'success.main' :
          status === 'error'   ? 'error.main' :
          status === 'testing' ? 'info.main' : 'grey.300',
      }}
    >
      {/* 测试中进度条 */}
      {status === 'testing' && (
        <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, borderRadius: '4px 4px 0 0' }} />
      )}

      <CardContent sx={{ flexGrow: 1, pt: status === 'testing' ? 3 : 2, pb: 1 }}>

        {/* ── 标题行 ── */}
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          {STATUS_ICON[status]}
          <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1, fontSize: '1rem' }}>
            {config.name}
          </Typography>
          {/* Key 错误类型标签 */}
          {testResult?.keyErrorType && testResult.keyErrorType !== 'unknown' && (
            <Chip
              size="small"
              icon={<WarningIcon />}
              label={KEY_ERROR_LABELS[testResult.keyErrorType]?.label}
              color={KEY_ERROR_LABELS[testResult.keyErrorType]?.color}
              variant="outlined"
              sx={{ fontSize: '0.65rem', height: 20 }}
            />
          )}
        </Box>

        {/* ── 类型标签 + 状态码 + 模型数量 ── */}
        <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
          <Chip
            label={API_TYPE_LABELS[config.type as ApiType] || config.type}
            size="small"
            color={config.type === 'openai' ? 'primary' : 'default'}
            variant="outlined"
          />
          {testResult?.statusCode && (
            <Chip
              label={`HTTP ${testResult.statusCode}`}
              size="small"
              color={testResult.statusCode < 400 ? 'success' : 'error'}
            />
          )}
          {testResult?.modelCount !== undefined && testResult.modelCount > 0 && (
            <Chip
              label={`${testResult.modelCount} 个模型`}
              size="small"
              color="info"
              variant="outlined"
            />
          )}
        </Box>

        {/* ── API 地址 ── */}
        <Typography variant="body2" color="text.secondary" mb={0.5} noWrap title={config.baseUrl}>
          <strong>地址：</strong>{config.baseUrl}
        </Typography>

        {/* ── API Key ── */}
        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
            <strong>Key：</strong>
          </Typography>
          <Typography variant="body2" fontFamily="monospace" color="text.secondary" noWrap sx={{ flexGrow: 1 }}>
            {showKey ? config.apiKey : maskedKey}
          </Typography>
          <Tooltip title={showKey ? '隐藏' : '显示'}>
            <IconButton size="small" onClick={() => setShowKey(!showKey)}>
              {showKey ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="复制 Key">
            <IconButton size="small" onClick={handleCopyKey}>
              <CopyIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* ── 备注 ── */}
        {config.remark && (
          <Typography variant="body2" color="text.secondary" mb={0.5}>
            <strong>备注：</strong>{config.remark}
          </Typography>
        )}

        {/* ── 测试结果摘要区域 ── */}
        {testResult && testResult.status !== 'untested' && (
          <Box mt={1} display="flex" flexDirection="column" gap={0.5}>

            {/* 响应时间 */}
            {testResult.responseTime !== undefined && (
              <Typography variant="caption" color="text.secondary">
                ⏱ 连通响应：
                <strong style={{ color: latencyColor(testResult.responseTime) }}>
                  {testResult.responseTime}ms
                </strong>
              </Typography>
            )}

            {/* 余额信息 */}
            {testResult.balance && <BalanceSummary balance={testResult.balance} />}

            {/* 对话可用性 */}
            {testResult.chatTest && <ChatSummary chat={testResult.chatTest} />}

            {/* 延迟测速 */}
            {testResult.latency && <LatencySummary latency={testResult.latency} />}

            {/* 速率限制 */}
            {testResult.rateLimit && <RateLimitSummary rateLimit={testResult.rateLimit} />}

            {/* 错误信息 */}
            {testResult.errorMessage && (
              <Box p={0.75} bgcolor="error.light" borderRadius={1} mt={0.5}>
                <Typography variant="caption" color="error.contrastText" sx={{ wordBreak: 'break-all' }}>
                  <strong>错误：</strong>{testResult.errorMessage.substring(0, 150)}
                  {testResult.errorMessage.length > 150 && '...'}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* ── 展开/收起 ── */}
        {hasDetails && (
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ mt: 1, p: 0, minWidth: 0, textTransform: 'none', fontSize: '0.75rem' }}
          >
            {expanded ? '收起' : '展开'}
          </Button>
        )}

        {/* ── 展开详情 ── */}
        <Collapse in={expanded}>
          <Box mt={1} display="flex" flexDirection="column" gap={1.5}>
            <Divider />

            {/* 模型列表 */}
            {testResult?.models && testResult.models.length > 0 && (
              <DetailBlock title={`可用模型列表（${testResult.models.length} 个）`}>
                <Box component="pre" sx={preStyle}>
                  {testResult.models.join('\n')}
                </Box>
              </DetailBlock>
            )}

            {/* 余额原始数据 */}
            {testResult?.balance?.supported && testResult.balance.raw && (
              <DetailBlock title="余额原始数据">
                <Box component="pre" sx={preStyle}>
                  {JSON.stringify(testResult.balance.raw, null, 2)}
                </Box>
              </DetailBlock>
            )}

            {/* 对话测试详情 */}
            {testResult?.chatTest && (
              <DetailBlock title="对话测试详情">
                <Box component="pre" sx={preStyle}>
                  {JSON.stringify(testResult.chatTest, null, 2)}
                </Box>
              </DetailBlock>
            )}

            {/* 延迟样本 */}
            {testResult?.latency && (
              <DetailBlock title="延迟样本（3 次）">
                <Box component="pre" sx={preStyle}>
                  {testResult.latency.samples.map((s, i) => `第 ${i + 1} 次：${s}ms`).join('\n')}
                  {`\n均值：${testResult.latency.avg}ms  最低：${testResult.latency.min}ms  最高：${testResult.latency.max}ms`}
                  {`\n稳定性评分：${testResult.latency.stability}%`}
                </Box>
              </DetailBlock>
            )}

            {/* 速率限制详情 */}
            {testResult?.rateLimit && (
              <DetailBlock title="速率限制（从响应头解析）">
                <Box component="pre" sx={preStyle}>
                  {JSON.stringify(testResult.rateLimit, null, 2)}
                </Box>
              </DetailBlock>
            )}

            {/* 响应头 */}
            {testResult?.responseHeaders && Object.keys(testResult.responseHeaders).length > 0 && (
              <DetailBlock title="响应头">
                <Box component="pre" sx={{ ...preStyle, maxHeight: 160 }}>
                  {Object.entries(testResult.responseHeaders)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('\n')}
                </Box>
              </DetailBlock>
            )}

            {/* 原始响应 */}
            {testResult?.rawResponse && (
              <DetailBlock title="原始响应">
                <Box component="pre" sx={preStyle}>
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(testResult.rawResponse), null, 2).substring(0, 1500);
                    } catch {
                      return testResult.rawResponse.substring(0, 1500);
                    }
                  })()}
                </Box>
              </DetailBlock>
            )}

            {/* 错误详情 */}
            {testResult?.errorMessage && (
              <DetailBlock title="错误详情">
                <Box component="pre" sx={{ ...preStyle, bgcolor: 'error.light', color: 'error.contrastText' }}>
                  {testResult.errorMessage}
                </Box>
              </DetailBlock>
            )}
          </Box>
        </Collapse>
      </CardContent>

      {/* ── 操作按钮 ── */}
      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 1.5, pt: 0 }}>
        <Tooltip title="查看完整详情（基础信息 + 测试结果 + 响应数据）">
          <Button
            size="small"
            variant="text"
            startIcon={<InfoIcon />}
            onClick={() => onShowDetail(config)}
            sx={{ mr: 'auto', textTransform: 'none' }}
          >
            详情
          </Button>
        </Tooltip>
        <Tooltip title="全量测试（连通性 + 余额 + 对话 + 延迟）">
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={status === 'testing' ? <CircularProgress size={14} /> : <TestIcon />}
            onClick={() => onTest(config)}
            disabled={status === 'testing'}
          >
            {status === 'testing' ? '测试中' : '测试'}
          </Button>
        </Tooltip>
        <Tooltip title="编辑">
          <IconButton size="small" onClick={() => onEdit(config)} color="primary">
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="删除">
          <IconButton size="small" onClick={() => onDelete(config.id)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

// 子组件

const DetailBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
      {title}
    </Typography>
    {children}
  </Box>
);


/** 余额摘要 */
const BalanceSummary: React.FC<{ balance: BalanceInfo }> = ({ balance }) => {
  if (!balance.supported) {
    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        <WalletIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography variant="caption" color="text.disabled">
          💰 余额：{balance.error || '不支持查询'}
        </Typography>
      </Box>
    );
  }
  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <WalletIcon sx={{ fontSize: 14, color: 'success.main' }} />
      <Typography variant="caption">
        💰 余额：
        {balance.remaining !== undefined ? (
          <strong>{balance.remaining.toFixed(4)} {balance.unit || ''}</strong>
        ) : balance.used !== undefined ? (
          <span>已用 <strong>{balance.used.toFixed(4)} {balance.unit}</strong></span>
        ) : '已获取（展开查看）'}
        {balance.total !== undefined && balance.remaining !== undefined && (
          <span style={{ color: '#999' }}> / {balance.total.toFixed(2)}</span>
        )}
      </Typography>
    </Box>
  );
};

/** 对话测试摘要 */
const ChatSummary: React.FC<{ chat: ChatTestResult }> = ({ chat }) => (
  <Box display="flex" alignItems="center" gap={0.5}>
    <ChatIcon sx={{ fontSize: 14, color: chat.available ? 'success.main' : 'error.main' }} />
    <Typography variant="caption">
      💬 对话：{chat.available ? (
        <>
          <strong style={{ color: '#4caf50' }}>可用</strong>
          {chat.model && <span style={{ color: '#999' }}> [{chat.model}]</span>}
          {chat.responseTime && <span style={{ color: '#999' }}> {chat.responseTime}ms</span>}
          {chat.totalTokens && <span style={{ color: '#999' }}> {chat.totalTokens} tokens</span>}
        </>
      ) : (
        <>
          <strong style={{ color: '#f44336' }}>不可用</strong>
          {chat.error && <span style={{ color: '#999' }}> — {chat.error.substring(0, 60)}</span>}
        </>
      )}
    </Typography>
  </Box>
);

/** 延迟摘要 */
const LatencySummary: React.FC<{ latency: LatencyResult }> = ({ latency }) => (
  <Box display="flex" alignItems="center" gap={0.5}>
    <LatencyIcon sx={{ fontSize: 14, color: latencyColor(latency.avg) }} />
    <Typography variant="caption">
      📶 延迟：<strong style={{ color: latencyColor(latency.avg) }}>{latency.avg}ms</strong>
      <span style={{ color: '#999' }}> (↓{latency.min} ↑{latency.max})</span>
      {' '}稳定性：<strong style={{ color: stabilityColor(latency.stability) }}>{latency.stability}%</strong>
    </Typography>
  </Box>
);

/** 速率限制摘要 */
const RateLimitSummary: React.FC<{ rateLimit: RateLimitInfo }> = ({ rateLimit }) => (
  <Box display="flex" alignItems="center" gap={0.5}>
    <BlockIcon sx={{ fontSize: 14, color: 'info.main' }} />
    <Typography variant="caption">
      🚦 速率限制：
      {rateLimit.requestsPerMinute !== undefined && <span>{rateLimit.requestsPerMinute} RPM </span>}
      {rateLimit.tokensPerMinute !== undefined && <span>{rateLimit.tokensPerMinute} TPM </span>}
      {rateLimit.remainingRequests !== undefined && (
        <span style={{ color: '#999' }}>(剩余 {rateLimit.remainingRequests} 次请求)</span>
      )}
      {rateLimit.remainingTokens !== undefined && (
        <span style={{ color: '#999' }}> (剩余 {rateLimit.remainingTokens} tokens)</span>
      )}
    </Typography>
  </Box>
);

export default ApiCard;
