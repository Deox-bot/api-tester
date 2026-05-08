/**
 * API 表单对话框组件
 * 用于添加或编辑 API 配置
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  InputAdornment,
  Box,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Close as CloseIcon,
} from '@mui/icons-material';
import { ApiConfig, ApiType } from '../types';
import { API_TYPE_OPTIONS } from '../constants';

interface ApiFormDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 编辑模式下的已有配置（null 表示新增） */
  editingConfig: ApiConfig | null;
  /** 保存回调 */
  onSave: (config: Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  /** 关闭回调 */
  onClose: () => void;
}

const ApiFormDialog: React.FC<ApiFormDialogProps> = ({
  open,
  editingConfig,
  onSave,
  onClose,
}) => {
  // 表单状态
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [type, setType] = useState<ApiType>('openai');
  const [remark, setRemark] = useState('');
  const [showKey, setShowKey] = useState(false);

  // 校验状态
  const [errors, setErrors] = useState<{ name?: string; baseUrl?: string; apiKey?: string }>({});

  // 编辑模式下填充表单
  useEffect(() => {
    if (editingConfig) {
      setName(editingConfig.name);
      setBaseUrl(editingConfig.baseUrl);
      setApiKey(editingConfig.apiKey);
      setType(editingConfig.type);
      setRemark(editingConfig.remark || '');
    } else {
      resetForm();
    }
  }, [editingConfig, open]);

  const resetForm = () => {
    setName('');
    setBaseUrl('');
    setApiKey('');
    setType('openai');
    setRemark('');
    setShowKey(false);
    setErrors({});
  };

  /** 表单验证 */
  const validate = (): boolean => {
    const newErrors: { name?: string; baseUrl?: string; apiKey?: string } = {};

    if (!name.trim()) {
      newErrors.name = '请输入厂商名称';
    }
    if (!baseUrl.trim()) {
      newErrors.baseUrl = '请输入 API 地址';
    } else {
      try {
        new URL(baseUrl.trim());
      } catch {
        newErrors.baseUrl = '请输入有效的 URL 地址';
      }
    }
    if (!apiKey.trim()) {
      newErrors.apiKey = '请输入 API Key';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** 提交表单 */
  const handleSubmit = () => {
    if (!validate()) return;

    onSave({
      name: name.trim(),
      baseUrl: baseUrl.trim().replace(/\/+$/, ''), // 去除末尾斜杠
      apiKey: apiKey.trim(),
      type,
      remark: remark.trim() || undefined,
    });

    resetForm();
  };

  /** 关闭对话框 */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {editingConfig ? '编辑 API 配置' : '添加 API 配置'}
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={3} pt={1}>
          {/* 厂商名称 */}
          <TextField
            label="厂商名称"
            placeholder='例如：OpenAI、Anthropic、自建中转站'
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            required
            fullWidth
            autoFocus
          />

          {/* API Base URL */}
          <TextField
            label="API Base URL"
            placeholder="例如：https://api.openai.com/v1"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            error={!!errors.baseUrl}
            helperText={errors.baseUrl}
            required
            fullWidth
          />

          {/* API Key */}
          <TextField
            label="API Key"
            type={showKey ? 'text' : 'password'}
            placeholder="请输入 API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            error={!!errors.apiKey}
            helperText={errors.apiKey}
            required
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowKey(!showKey)} edge="end">
                    {showKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* API 类型 */}
          <FormControl fullWidth>
            <InputLabel>API 类型</InputLabel>
            <Select
              value={type}
              label="API 类型"
              onChange={(e) => setType(e.target.value as ApiType)}
            >
              {API_TYPE_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 备注 */}
          <TextField
            label="备注（可选）"
            placeholder="添加备注信息..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>取消</Button>
        <Button onClick={handleSubmit} variant="contained" size="large">
          {editingConfig ? '保存修改' : '添加'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApiFormDialog;
