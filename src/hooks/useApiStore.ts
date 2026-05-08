/**
 * API 存储 Hook
 * 使用 localStorage 实现数据持久化
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiConfig } from '../types';
import { STORAGE_KEY } from '../constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * 从 localStorage 加载 API 配置列表
 */
function loadFromStorage(): ApiConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error('Failed to load API configs from localStorage');
    return [];
  }
}

/**
 * 保存 API 配置列表到 localStorage
 */
function saveToStorage(configs: ApiConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  } catch (e) {
    console.error('Failed to save API configs to localStorage', e);
  }
}

/**
 * API 存储管理 Hook
 * 提供 CRUD 操作和批量导入功能
 */
export function useApiStore() {
  const [configs, setConfigs] = useState<ApiConfig[]>(loadFromStorage);

  // 配置变化时自动保存到 localStorage
  useEffect(() => {
    saveToStorage(configs);
  }, [configs]);

  /**
   * 添加 API 配置
   */
  const addConfig = useCallback((config: Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const newConfig: ApiConfig = {
      ...config,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    setConfigs(prev => [...prev, newConfig]);
    return newConfig;
  }, []);

  /**
   * 更新 API 配置
   */
  const updateConfig = useCallback((id: string, updates: Partial<Omit<ApiConfig, 'id' | 'createdAt'>>) => {
    setConfigs(prev =>
      prev.map(config =>
        config.id === id
          ? { ...config, ...updates, updatedAt: Date.now() }
          : config
      )
    );
  }, []);

  /**
   * 删除 API 配置
   */
  const deleteConfig = useCallback((id: string) => {
    setConfigs(prev => prev.filter(config => config.id !== id));
  }, []);

  /**
   * 批量导入 API 配置（支持去重）
   * @param imports 要导入的配置列表
   * @param overwrite 是否覆盖已存在的配置（按 baseUrl 判断）
   * @returns 实际导入的数量
   */
  const batchImport = useCallback((imports: Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'>[], overwrite: boolean = false): number => {
    let imported = 0;
    
    setConfigs(prev => {
      const existing = new Map(prev.map(c => [c.baseUrl, c]));
      const result = [...prev];

      for (const item of imports) {
        const existingConfig = existing.get(item.baseUrl);
        
        if (existingConfig) {
          if (overwrite) {
            // 覆盖已存在的配置
            const index = result.findIndex(c => c.id === existingConfig.id);
            if (index !== -1) {
              result[index] = {
                ...existingConfig,
                ...item,
                id: existingConfig.id,
                createdAt: existingConfig.createdAt,
                updatedAt: Date.now(),
              };
            }
            imported++;
          }
          // 不去重则跳过
        } else {
          // 新增配置
          const now = Date.now();
          const newConfig: ApiConfig = {
            ...item,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
          };
          result.push(newConfig);
          existing.set(newConfig.baseUrl, newConfig);
          imported++;
        }
      }

      return result;
    });

    return imported;
  }, []);

  /**
   * 导出所有配置为 JSON（不包含 API Key 的脱敏版本可选）
   */
  const exportConfigs = useCallback((maskKeys: boolean = false): string => {
    const data = configs.map(config => ({
      name: config.name,
      baseUrl: config.baseUrl,
      apiKey: maskKeys ? '***' + config.apiKey.slice(-4) : config.apiKey,
      type: config.type,
      remark: config.remark,
    }));
    return JSON.stringify(data, null, 2);
  }, [configs]);

  /**
   * 清空所有配置
   */
  const clearAll = useCallback(() => {
    setConfigs([]);
  }, []);

  return {
    configs,
    addConfig,
    updateConfig,
    deleteConfig,
    batchImport,
    exportConfigs,
    clearAll,
  };
}
