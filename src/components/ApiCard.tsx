/**
 * API 卡片组件
 * 展示单个 API 配置的摘要信息，支持编辑、删除、测试操作
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Box,
  LinearProgress,
  Collapse,
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
} from '@mui/icons-material';
import { ApiConfig, TestResult, ApiType, API_TYPE_LABELS, TestStatus } from '../types';

interface ApiCardProps {
  config: ApiConfig;
  testResult?: TestResult;
  onEdit: (config: ApiConfig) => void;
  onDelete: (id: string) => void;
  onTest: (config: ApiConfig) => void;
}

/** 状态图标映射 */
const STATUS_ICON: Record<TestStatus, React.ReactNode> = {
  untested: <UntestedIcon color="disabled" />,
  testing: <TestIcon color="info" />,  
  success: <SuccessIcon color="success" />,
  error: <ErrorIcon color="error" />,
};

/** 状态文本映射 */
const STATUS_TEXT: Record<TestStatus, string> = {
  untested: '未测试',
  testing: '测试中...',
  success: '成功',
  error: '失败',
};

const ApiCard: React.FC<ApiCardProps> = ({ config, testResult, onEdit, onDelete, onTest }) => {
  const [expanded, setExpanded] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const status = testResult?.status || 'untested';

  /** 复制 API Key 到剪贴板 */
  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(config.apiKey);
    } catch {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = config.apiKey;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  /** 掩码 API Key */
  const maskedKey = config.apiKey.length > 8
    ? `${config.apiKey.slice(0, 4)}...${config.apiKey.slice(-4)}`
    : '****';

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.2s',
        '&:hover': { elevation: 4 },
        borderLeft: 4,
        borderColor: 
          status === 'success' ? 'success.main' :
          status === 'error' ? 'error.main' :
          status === 'testing' ? 'info.main' : 'grey.300',
      }}
    >
      {/* 测试中进度条 */}
      {status === 'testing' && (
        <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
      )}

      <CardContent sx={{ flexGrow: 1, pt: status === 'testing' ? 3 : 2 }}>
        {/* 标题行：状态图标 + 名称 */}
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          {STATUS_ICON[status]}
          <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
            {config.name}
          </Typography>
        </Box>

        {/* API 类型标签 */}
        <Box mb={1.5}>
          <Chip
            label={API_TYPE_LABELS[config.type as ApiType] || config.type}
            size="small"
            color={config.type === 'openai' ? 'primary' : 'default'}
            variant="outlined"
          />
          {testResult?.statusCode && (
            <Chip
              label={testResult.statusCode}
              size="small"
              color={testResult.statusCode < 400 ? 'success' : 'error'}
              sx={{ ml: 1 }}
            />
          )}
        </Box>

        {/* API 地址 */}
        <Typography variant="body2" color="text.secondary" mb={0.5} noWrap>
          <strong>地址：</strong>{config.baseUrl}
        </Typography>

        {/* API Key（可切换显示/隐藏） */}
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <Typography variant="body2" color="text.secondary">
            <strong>Key：</strong>
          </Typography>
          <Typography variant="body2" fontFamily="monospace" color="text.secondary">
            {showKey ? config.apiKey : maskedKey}
          </Typography>
          <Tooltip title={showKey ? '隐藏' : '显示'}>
            <IconButton size="small" onClick={() => setShowKey(!showKey)}>
              {showKey ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="复制 Key">
            <IconButton size="small" onClick={handleCopyKey}>
              <CopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* 备注 */}
        {config.remark && (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            <strong>备注：</strong>{config.remark}
          </Typography>
        )}

        {/* 测试结果摘要 */}
        {testResult && testResult.status !== 'untested' && (
          <Box mt={1.5} p={1} bgcolor="action.hover" borderRadius={1}>
            <Typography variant="caption" display="block">
              <strong>状态：</strong>{STATUS_TEXT[testResult.status]}
            </Typography>
            {testResult.responseTime !== undefined && (
              <Typography variant="caption" display="block">
                <strong>响应时间：</strong>{testResult.responseTime}ms
              </Typography>
            )}
            {testResult.modelCount !== undefined && (
              <Typography variant="caption" display="block">
                <strong>模型数量：</strong>{testResult.modelCount}
              </Typography>
            )}
            {testResult.errorMessage && (
              <Typography variant="caption" display="block" color="error">
                <strong>错误：</strong>{testResult.errorMessage.substring(0, 100)}
                {testResult.errorMessage.length > 100 && '...'}
              </Typography>
            )}
          </Box>
        )}

        {/* 展开详情按钮 */}
        {(testResult?.models?.length || testResult?.rawResponse) && (
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ mt: 1, p: 0 }}
          >
            {expanded ? '收起详情' : '查看详情'}
          </Button>
        )}

        {/* 展开的详情区域 */}
        <Collapse in={expanded}>
          <Box mt={1}>
            {testResult?.models && testResult.models.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>可用模型：</Typography>
                <Box
                  component="pre"
                  sx={{
                    maxHeight: 200,
                    overflow: 'auto',
                    p: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                  }}
                >
                  {testResult.models.join('\n')}
                </Box>
              </Box>
            )}
            {testResult?.errorMessage && (
              <Box mt={1}>
                <Typography variant="subtitle2" color="error">错误信息：</Typography>
                <Box
                  component="pre"
                  sx={{
                    maxHeight: 200,
                    overflow: 'auto',
                    p: 1,
                    bgcolor: 'error.light',
                    color: 'error.contrastText',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {testResult.errorMessage}
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>

      {/* 操作按钮 */}
      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        <Tooltip title="测试连通性">
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<TestIcon />}
            onClick={() => onTest(config)}
            disabled={status === 'testing'}
          >
            {status === 'testing' ? '测试中' : '测试'}
          </Button>
        </Tooltip>
        <Tooltip title="编辑">
          <IconButton size="small" onClick={() => onEdit(config)} color="primary">
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="删除">
          <IconButton size="small" onClick={() => onDelete(config.id)} color="error">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default ApiCard;
