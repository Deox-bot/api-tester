/**
 * App 主组件
 * 整合所有功能：API 列表展示、添加/编辑、导入、测试、导出
 */

import { useState, useCallback } from 'react';
import {
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Box,
  Button,
  Typography,
  Alert,
  Grid,
  Fade,
  Paper,
  Snackbar,
  Alert as MuiAlert,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as ImportIcon,
} from '@mui/icons-material';
import { ThemeMode, API_TYPE_LABELS, ApiConfig } from './types';
import { useApiStore } from './hooks/useApiStore';
import { useApiTest } from './hooks/useApiTest';
import ApiCard from './components/ApiCard';
import ApiFormDialog from './components/ApiFormDialog';
import BatchImportDialog from './components/BatchImportDialog';
import TestResultPanel from './components/TestResultPanel';
import ApiDetailDialog from './components/ApiDetailDialog';
import ApiListHeader from './components/ApiListHeader';

function App() {
  // ========== 主题 ==========
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    prefersDarkMode ? 'dark' : 'light'
  );

  const theme = createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: themeMode === 'light' ? '#1976d2' : '#90caf9',
      },
      secondary: {
        main: themeMode === 'light' ? '#9c27b0' : '#ce93d8',
      },
    },
    shape: {
      borderRadius: 12,
    },
  });

  const toggleTheme = useCallback(() => {
    setThemeMode(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // ========== API 存储 ==========
  const {
    configs,
    addConfig,
    updateConfig,
    deleteConfig,
    batchImport,
    exportConfigs,
  } = useApiStore();

  // ========== API 测试 ==========
  const {
    testResults,
    batchTesting,
    batchProgress,
    testSingle,
    testAll,
    getResult,
  } = useApiTest();

  // ========== UI 状态 ==========
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<typeof configs[0] | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // ========== API 详情对话框 ==========
  const [detailConfig, setDetailConfig] = useState<typeof configs[0] | null>(null);

  /** 打开详情对话框 */
  const handleShowDetail = useCallback((config: typeof configs[0]) => {
    setDetailConfig(config);
  }, []);

  /** 关闭详情对话框 */
  const handleCloseDetail = useCallback(() => {
    setDetailConfig(null);
  }, []);

  // ========== 搜索过滤 ==========
  const filteredConfigs = configs.filter(config => {
    if (!search.trim()) return true;
    const keyword = search.toLowerCase();
    return (
      config.name.toLowerCase().includes(keyword) ||
      config.baseUrl.toLowerCase().includes(keyword) ||
      (config.remark && config.remark.toLowerCase().includes(keyword)) ||
      API_TYPE_LABELS[config.type]?.toLowerCase().includes(keyword)
    );
  });

  // ========== 事件处理 ==========

  /** 添加按钮点击 */
  const handleAdd = useCallback(() => {
    setEditingConfig(null);
    setFormOpen(true);
  }, []);

  /** 编辑按钮点击 */
  const handleEdit = useCallback((config: typeof configs[0]) => {
    setEditingConfig(config);
    setFormOpen(true);
  }, []);

  /** 保存 API 配置（新增/编辑） */
  const handleSave = useCallback((configData: Omit<typeof configs[0], 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingConfig) {
      updateConfig(editingConfig.id, configData);
      setSnackbar({ open: true, message: '配置已更新', severity: 'success' });
    } else {
      addConfig(configData);
      setSnackbar({ open: true, message: 'API 配置已添加', severity: 'success' });
    }
    setFormOpen(false);
    setEditingConfig(null);
  }, [editingConfig, addConfig, updateConfig]);

  /** 删除 API 配置 */
  const handleDelete = useCallback((id: string) => {
    const config = configs.find(c => c.id === id);
    if (config && window.confirm(`确定要删除「${config.name}」吗？`)) {
      deleteConfig(id);
      setSnackbar({ open: true, message: '配置已删除', severity: 'info' });
    }
  }, [configs, deleteConfig]);

  /** 测试单个 API */
  const handleTest = useCallback((config: typeof configs[0]) => {
    testSingle(config);
  }, [testSingle]);

  /** 批量测试 */
  const handleTestAll = useCallback(() => {
    if (configs.length === 0) return;
    testAll(configs);
    setSnackbar({ open: true, message: `开始测试 ${configs.length} 个 API...`, severity: 'info' });
  }, [configs, testAll]);

  /** 导出配置 */
  const handleExport = useCallback(() => {
    const json = exportConfigs(false);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-configs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackbar({ open: true, message: '配置已导出', severity: 'success' });
  }, [exportConfigs]);

  /** 批量导入 */
  const handleImport = useCallback((imports: Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'>[], overwrite: boolean) => {
    const count = batchImport(imports, overwrite);
    setSnackbar({ open: true, message: `成功导入 ${count} 个配置`, severity: 'success' });
    return count;
  }, [batchImport]);

  // ========== 渲染 ==========

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 3, minHeight: '100vh' }}>
        {/* 头部操作栏 */}
        <ApiListHeader
          search={search}
          onSearchChange={setSearch}
          themeMode={themeMode}
          onToggleTheme={toggleTheme}
          onAdd={handleAdd}
          onImport={() => setImportOpen(true)}
          onExport={handleExport}
          onTestAll={handleTestAll}
          testAllDisabled={batchTesting}
          totalCount={configs.length}
        />

        {/* CORS 提示 */}
        <Fade in={configs.length > 0}>
          <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>注意：</strong>由于浏览器安全限制（CORS），部分 API 可能无法直接从浏览器测试。
              如果遇到 CORS 错误，可以采用以下方法：1) 使用支持 CORS 的 API 代理；2) 使用浏览器插件临时禁用 CORS（仅用于测试）；3) 使用服务端代理。
            </Typography>
          </Alert>
        </Fade>

        {/* 测试结果面板 */}
        <Fade in={Object.keys(testResults).length > 0 || batchTesting}>
          <Box>
            <TestResultPanel
              results={testResults}
              batchTesting={batchTesting}
              progress={batchProgress}
              configs={configs}
            />
          </Box>
        </Fade>

        {/* API 列表 */}
        {filteredConfigs.length > 0 ? (
          <Grid container spacing={2}>
            {filteredConfigs.map(config => (
              <Grid item xs={12} sm={6} lg={4} key={config.id}>
                <ApiCard
                  config={config}
                  testResult={getResult(config.id)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTest={handleTest}
                  onShowDetail={handleShowDetail}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Fade in={configs.length === 0}>
            <Paper
              elevation={0}
              sx={{
                textAlign: 'center',
                py: 8,
                px: 2,
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 3,
                mt: 2,
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {configs.length === 0 ? '还没有添加任何 API 配置' : '没有找到匹配的 API'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                {configs.length === 0
                  ? '点击「添加」按钮或「导入」来添加你的第一个 API 配置'
                  : '尝试修改搜索关键词'}
              </Typography>
              {configs.length === 0 && (
                <Box display="flex" gap={1} justifyContent="center">
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                  >
                    添加
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ImportIcon />}
                    onClick={() => setImportOpen(true)}
                  >
                    导入
                  </Button>
                </Box>
              )}
            </Paper>
          </Fade>
        )}

        {/* 添加/编辑对话框 */}
        <ApiFormDialog
          open={formOpen}
          editingConfig={editingConfig}
          onSave={handleSave}
          onClose={() => {
            setFormOpen(false);
            setEditingConfig(null);
          }}
        />

        {/* 批量导入对话框 */}
        <BatchImportDialog
          open={importOpen}
          onImport={handleImport}
          onClose={() => setImportOpen(false)}
        />

        {/* API 详情对话框 */}
        <ApiDetailDialog
          open={detailConfig !== null}
          config={detailConfig}
          testResult={detailConfig ? testResults[detailConfig.id] : undefined}
          onClose={handleCloseDetail}
        />

        {/* Toast 提示 */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <MuiAlert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </MuiAlert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;
