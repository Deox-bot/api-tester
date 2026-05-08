/**
 * 模型列表查看器组件
 * 以可读格式展示 API 返回的模型列表
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Collapse,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

interface ModelListViewerProps {
  /** 模型列表 */
  models: string[];
  /** 默认是否展开 */
  defaultExpanded?: boolean;
}

const ModelListViewer: React.FC<ModelListViewerProps> = ({
  models,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [search, setSearch] = useState('');

  // 过滤模型列表
  const filteredModels = search
    ? models.filter(m => m.toLowerCase().includes(search.toLowerCase()))
    : models;

  if (!models || models.length === 0) {
    return null;
  }

  return (
    <Box mt={1}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        onClick={() => setExpanded(!expanded)}
        sx={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <Typography variant="subtitle2">
          可用模型列表（{models.length}）
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box mt={1}>
          {models.length > 10 && (
            <TextField
              size="small"
              placeholder="搜索模型..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1, width: '100%' }}
            />
          )}

          <Paper
            variant="outlined"
            sx={{
              maxHeight: 300,
              overflow: 'auto',
              p: 1,
              bgcolor: 'background.default',
            }}
          >
            <List dense>
              {filteredModels.map((model, i) => (
                <ListItem key={i} sx={{ py: 0.25 }}>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          wordBreak: 'break-all',
                        }}
                      >
                        {model}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>

            {search && filteredModels.length === 0 && (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                没有找到匹配的模型
              </Typography>
            )}
          </Paper>

          {search && (
            <Typography variant="caption" color="text.secondary">
              显示 {filteredModels.length} / {models.length} 个模型
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default ModelListViewer;
