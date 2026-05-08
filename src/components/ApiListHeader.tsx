/**
 * API 列表头部操作栏组件
 * 包含搜索、添加、导入、导出、批量测试等功能入口
 */

import React from 'react';
import {
  Box,
  TextField,
  Button,
  Tooltip,
  Typography,
  useMediaQuery,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as ImportIcon,
  Download as ExportIcon,
  Speed as TestAllIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { ThemeMode } from '../types';

interface ApiListHeaderProps {
  /** 搜索关键词 */
  search: string;
  /** 搜索关键词变化回调 */
  onSearchChange: (value: string) => void;
  /** 主题模式 */
  themeMode: ThemeMode;
  /** 切换主题回调 */
  onToggleTheme: () => void;
  /** 添加按钮点击 */
  onAdd: () => void;
  /** 导入按钮点击 */
  onImport: () => void;
  /** 导出按钮点击 */
  onExport: () => void;
  /** 全部测试按钮点击 */
  onTestAll: () => void;
  /** 全部测试是否禁用（正在测试中） */
  testAllDisabled: boolean;
  /** 配置总数 */
  totalCount: number;
}

const ApiListHeader: React.FC<ApiListHeaderProps> = ({
  search,
  onSearchChange,
  themeMode,
  onToggleTheme,
  onAdd,
  onImport,
  onExport,
  onTestAll,
  testAllDisabled,
  totalCount,
}) => {
  const isMobile = useMediaQuery('(max-width:768px)');

  return (
    <Box>
      {/* 标题行 */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
        mb={2}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="h5" component="h1" fontWeight="bold">
            API 连通性测试工具
          </Typography>
          {totalCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              （共 {totalCount} 个配置）
            </Typography>
          )}
        </Box>

        <Tooltip title={themeMode === 'light' ? '切换到深色模式' : '切换到浅色模式'}>
          <Button
            onClick={onToggleTheme}
            startIcon={themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            variant="outlined"
            size="small"
          >
            {isMobile ? '' : (themeMode === 'light' ? '深色' : '浅色')}
          </Button>
        </Tooltip>
      </Box>

      {/* 搜索栏 + 操作按钮 */}
      <Stack
        direction={isMobile ? 'column' : 'row'}
        spacing={1}
        alignItems={isMobile ? 'stretch' : 'center'}
      >
        <TextField
          label="搜索 API..."
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ flexGrow: 1, minWidth: isMobile ? '100%' : 250 }}
          placeholder="按名称、地址搜索..."
        />

        <Stack direction="row" spacing={1} flexShrink={0}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
            size={isMobile ? 'medium' : 'medium'}
          >
            添加
          </Button>

          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={onImport}
          >
            导入
          </Button>

          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={onExport}
            disabled={totalCount === 0}
          >
            导出
          </Button>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<TestAllIcon />}
            onClick={onTestAll}
            disabled={testAllDisabled || totalCount === 0}
          >
            全部测试
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default ApiListHeader;
