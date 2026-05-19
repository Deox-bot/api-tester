/**
 * API 测试逻辑 Hook
 * 管理测试状态、执行单个/批量测试
 */

import { useState, useCallback, useRef } from 'react';
import { ApiConfig, TestResult } from '../types';
import { testApiConnectivity, testApisBatch } from '../utils/api';

/**
 * API 测试管理 Hook
 */
export function useApiTest() {
  // 存储所有测试结果，以 apiId 为键
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  // 批量测试正在进行中
  const [batchTesting, setBatchTesting] = useState(false);
  // 批量测试进度
  const [batchProgress, setBatchProgress] = useState({ completed: 0, total: 0 });
  // 用 ref 追踪取消状态
  const cancelRef = useRef(false);

  /**
   * 取消批量测试
   */
  const cancelTest = useCallback(() => {
    cancelRef.current = true;
  }, []);

  /**
   * 测试单个 API
   */
  const testSingle = useCallback(async (config: ApiConfig): Promise<TestResult> => {
    // 设置测试中状态
    setTestResults(prev => ({
      ...prev,
      [config.id]: { apiId: config.id, status: 'testing' },
    }));

    try {
      const result = await testApiConnectivity(config);
      
      setTestResults(prev => ({
        ...prev,
        [config.id]: result,
      }));

      return result;
    } catch (error: any) {
      const errorResult: TestResult = {
        apiId: config.id,
        status: 'error',
        errorMessage: error.message || '测试失败',
        testedAt: Date.now(),
      };

      setTestResults(prev => ({
        ...prev,
        [config.id]: errorResult,
      }));

      return errorResult;
    }
  }, []);

  /**
   * 批量测试所有 API
   */
  const testAll = useCallback(async (configs: ApiConfig[]) => {
    if (configs.length === 0) return;
    
    setBatchTesting(true);
    setBatchProgress({ completed: 0, total: configs.length });
    cancelRef.current = false;

    try {
      await testApisBatch(configs, (results, completed, total) => {
        // 检查是否已取消
        if (cancelRef.current) {
          throw new Error('Test cancelled by user');
        }

        // 更新结果映射
        const resultMap: Record<string, TestResult> = {};
        for (const r of results) {
          if (r.apiId) {
            resultMap[r.apiId] = r;
          }
        }
        setTestResults(prev => ({ ...prev, ...resultMap }));
        setBatchProgress({ completed, total });
      });
    } catch (error: any) {
      if (error.message === 'Test cancelled by user') {
        console.log('Batch test cancelled');
      } else {
        console.error('Batch test error:', error);
      }
    } finally {
      setBatchTesting(false);
    }
  }, []);

  /**
   * 清除某个 API 的测试结果
   */
  const clearResult = useCallback((apiId: string) => {
    setTestResults(prev => {
      const next = { ...prev };
      delete next[apiId];
      return next;
    });
  }, []);

  /**
   * 清除所有测试结果
   */
  const clearAllResults = useCallback(() => {
    setTestResults({});
  }, []);

  /**
   * 获取某个 API 的测试结果
   */
  const getResult = useCallback((apiId: string): TestResult | undefined => {
    return testResults[apiId];
  }, [testResults]);

  /**
   * 获取测试状态摘要
   */
  const getSummary = useCallback(() => {
    const results = Object.values(testResults);
    return {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      error: results.filter(r => r.status === 'error').length,
      testing: results.filter(r => r.status === 'testing').length,
      untested: results.filter(r => r.status === 'untested').length,
    };
  }, [testResults]);

  return {
    testResults,
    batchTesting,
    batchProgress,
    testSingle,
    testAll,
    cancelTest,
    clearResult,
    clearAllResults,
    getResult,
    getSummary,
  };
}
