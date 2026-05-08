/**
 * 批量导入对话框组件
 * 支持 JSON 格式批量导入 API 配置，提供预览和去重选项
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  FileCopy as PasteIcon,
} from '@mui/icons-material';
import { ApiType, ImportApiConfig } from '../types';
import { API_TYPE_OPTIONS, DEFAULT_API_TYPE } from '../constants';

interface BatchImportDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 导入回调 */
  onImport: (configs: Omit<ImportApiConfig, 'id' | 'createdAt' | 'updatedAt'>[], overwrite: boolean) => number;
  /** 关闭回调 */
  onClose: () => void;
}

/** JSON 格式示例 */
const JSON_EXAMPLE = `[
  {
    "name": "OpenAI",
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-xxx",
    "type": "openai",
    "remark": "官方API"
  },
  {
    "name": "Anthropic",
    "baseUrl": "https://api.anthropic.com",
    "apiKey": "sk-ant-xxx",
    "type": "anthropic",
    "remark": "Claude API"
  }
]`;

const BatchImportDialog: React.FC<BatchImportDialogProps> = ({
  open,
  onImport,
  onClose,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [parsed, setParsed] = useState<ImportApiConfig[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; message: string } | null>(null);

  /** 解析 JSON 文本 */
  const handleParse = useCallback(() => {
    setParseError(null);
    setParsed(null);
    setImportResult(null);

    if (!jsonText.trim()) {
      setParseError('请输入 JSON 内容');
      return;
    }

    try {
      const data = JSON.parse(jsonText);
      
      if (!Array.isArray(data)) {
        setParseError('JSON 必须是一个数组');
        return;
      }

      // 验证和规范化每个条目
      const validated: ImportApiConfig[] = [];
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        
        if (!item.name || !item.baseUrl || !item.apiKey) {
          setParseError(`第 ${i + 1} 项缺少必填字段（name、baseUrl、apiKey）`);
          return;
        }

        validated.push({
          name: String(item.name),
          baseUrl: String(item.baseUrl).replace(/\/+$/, ''),
          apiKey: String(item.apiKey),
          type: (item.type as ApiType) || DEFAULT_API_TYPE,
          remark: item.remark ? String(item.remark) : undefined,
        });
      }

      setParsed(validated);
    } catch (e: any) {
      setParseError(`JSON 解析错误：${e.message}`);
    }
  }, [jsonText]);

  /** 执行导入 */
  const handleImport = useCallback(() => {
    if (!parsed) return;

    setImporting(true);
    
    // 模拟短暂延迟以显示 loading 效果
    setTimeout(() => {
      const count = onImport(parsed, overwrite);
      setImporting(false);
      setImportResult({
        success: count,
        message: `成功导入 ${count} 个 API 配置${overwrite ? '（已覆盖重复项）' : '（跳过重复项）'}`,
      });
      setParsed(null);
      setJsonText('');
    }, 300);
  }, [parsed, overwrite, onImport]);

  /** 加载示例 */
  const loadExample = () => {
    setJsonText(JSON_EXAMPLE);
    setParseError(null);
    setParsed(null);
    setImportResult(null);
  };

  /** 关闭对话框 */
  const handleClose = () => {
    setJsonText('');
    setParsed(null);
    setParseError(null);
    setImportResult(null);
    setOverwrite(false);
    onClose();
  };

  /** 粘贴剪贴板内容 */
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonText(text);
    } catch {
      // 剪贴板权限被拒绝，不做处理
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        批量导入 API 配置
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box p={2}>
          {/* 说明文字 */}
          <Alert severity="info" sx={{ mb: 2 }}>
            请粘贴 JSON 格式的 API 配置列表。JSON 必须是一个数组，每条记录包含 name、baseUrl、apiKey 字段。
          </Alert>

          {/* JSON 输入区域 */}
          <TextField
            label="JSON 配置"
            multiline
            rows={8}
            fullWidth
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setParseError(null);
              setParsed(null);
              setImportResult(null);
            }}
            placeholder='粘贴 JSON 配置，或点击"加载示例"查看格式...'
            InputProps={{
              endAdornment: (
                <Button
                  size="small"
                  startIcon={<PasteIcon />}
                  onClick={handlePaste}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  粘贴
                </Button>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* 操作按钮 */}
          <Box display="flex" gap={1} mb={2}>
            <Button variant="outlined" onClick={handleParse}>
              解析预览
            </Button>
            <Button variant="text" onClick={loadExample}>
              加载示例
            </Button>
          </Box>

          {/* 解析错误 */}
          {parseError && (
            <Alert severity="error" sx={{ mb: 2 }}>{parseError}</Alert>
          )}

          {/* 解析成功预览 */}
          {parsed && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                预览（共 {parsed.length} 条配置）：
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>名称</TableCell>
                      <TableCell>Base URL</TableCell>
                      <TableCell>类型</TableCell>
                      <TableCell>备注</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsed.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {item.baseUrl}
                        </TableCell>
                        <TableCell>
                          {API_TYPE_OPTIONS.find(o => o.value === item.type)?.label || item.type}
                        </TableCell>
                        <TableCell>{item.remark || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box display="flex" alignItems="center" mt={2}>
                <Checkbox
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                />
                <Typography variant="body2">
                  覆盖已存在的配置（按 Base URL 判断）
                </Typography>
              </Box>
            </Box>
          )}

          {/* 导入结果 */}
          {importResult && (
            <Alert severity="success" sx={{ mb: 2 }}>{importResult.message}</Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>关闭</Button>
        {parsed && (
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={importing}
            startIcon={importing ? <CircularProgress size={16} /> : null}
          >
            {importing ? '导入中...' : `确认导入（${parsed.length} 条）`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BatchImportDialog;
