# API Tester

> 统一管理多厂商 AI API，批量测试连通性，查看模型列表

一个跨平台桌面应用（Electron）+ Web 工具，用于集中管理 OpenAI、Anthropic、Google、Azure 以及各类中转站的 API 配置，支持一键连通性测试和模型列表查看。

## 功能特性

- **API 管理** — 卡片式展示所有 API 配置，支持增删改查
- **批量导入** — JSON 格式一键导入多个配置，自动按 URL 去重
- **连通性测试** — 单个 / 全量测试，显示响应时间、状态码、可用模型数
- **模型浏览** — 查看每个 API 返回的完整模型列表
- **余额查询** — 查询 API Key 账户余额和使用量
- **对话测试** — 对指定模型发送对话请求，验证模型可用性
- **延迟测速** — 测量 API 响应延迟
- **Key 错误分析** — 自动识别 Key 过期、额度不足等错误类型
- **速率限制检测** — 检测 API 的速率限制信息
- **API 详情** — 查看每个 API 配置的完整测试结果和详情
- **数据持久化** — localStorage 本地存储，刷新不丢失
- **导出配置** — 一键导出为 JSON 文件
- **深色模式** — 支持浅色/深色主题切换
- **搜索过滤** — 按名称、地址、备注快速查找
- **桌面应用** — 支持 Electron 打包为 Windows 桌面应用，带启动画面

## 截图

| API 列表 | 添加配置 | 批量导入 |
|:---:|:---:|:---:|
| （待补充） | （待补充） | （待补充） |

## 支持的 API 类型

| 类型 | 说明 |
|------|------|
| OpenAI Compatible | 兼容 OpenAI 接口格式的服务（含各类中转站） |
| Anthropic | Anthropic 官方 API |
| Google AI | Google Gemini API |
| Azure OpenAI | 微软 Azure OpenAI 服务 |
| 自定义中转站 | 各类第三方代理/中转服务 |
| 其他 | 不属于以上分类的 API |

## 快速开始

### 环境要求

- Node.js >= 16
- npm >= 7

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/Deox-bot/api-tester.git
cd api-tester

# 安装依赖
npm install
```

### Web 开发模式

```bash
npm run dev
```

浏览器访问 http://localhost:5173 即可使用。

### Electron 桌面开发模式

```bash
npm run electron:dev
```

自动启动 Vite 开发服务器和 Electron 窗口。

### 构建桌面安装包

```bash
npm run dist
```

构建产物在 `release/` 目录，生成 Windows 安装程序（NSIS）。

### 仅构建 Web 版本

```bash
npm run build
```

构建产物在 `dist/` 目录，可部署到任意静态托管服务（Vercel / GitHub Pages / Nginx 等）。

## 使用说明

### 添加 API 配置

点击「添加」按钮，填写以下信息：

- **名称**：自定义标识（如 "OpenAI 官方"、"某中转站"）
- **Base URL**：API 地址（如 `https://api.openai.com/v1`）
- **API Key**：对应的密钥
- **类型**：选择 API 服务商类型
- **备注**：可选的补充说明

### 批量导入

准备 JSON 格式的配置文件：

```json
[
  {
    "name": "OpenAI",
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-xxx",
    "type": "openai",
    "remark": "官方 API"
  },
  {
    "name": "我的中转站",
    "baseUrl": "https://relay.example.com/v1",
    "apiKey": "sk-yyy",
    "type": "custom"
  }
]
```

在「导入」对话框中粘贴 JSON 内容，确认后即可批量添加。

### 连通性测试

- **单个测试**：点击 API 卡片上的「测试」按钮
- **全部测试**：点击顶部操作栏的「全部测试」按钮

测试时会向 `{baseUrl}/models` 发送请求并携带鉴权信息，根据返回结果判断是否连通。

> **注意**：Web 版本由于浏览器 CORS 安全限制，部分 API 可能无法直接从前端发起请求。建议使用桌面版（Electron）或启动代理服务器解决跨域问题。

### 代理服务器（解决 CORS）

```bash
node proxy-server.js
```

代理服务器运行在 `http://localhost:3001`，可转发 API 请求以绕过浏览器跨域限制。

### 导出配置

点击「导出」按钮下载当前所有配置的 JSON 备份文件。

## 技术栈

| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Electron 33 | 桌面应用框架 |
| Material UI (MUI) | UI 组件库 |
| Tailwind CSS | 原子化样式 |
| electron-builder | 应用打包 |

## 项目结构

```
api-tester/
├── electron/                    # Electron 主进程
│   ├── main.cjs                 # 主进程入口（含 Splash 启动画面）
│   └── preload.cjs              # 预加载脚本
├── src/                         # 前端源代码
│   ├── main.tsx                 # 应用入口
│   ├── App.tsx                  # 主组件
│   ├── index.css                # 全局样式 + Tailwind
│   ├── types/
│   │   └── index.ts             # 类型定义
│   ├── constants/
│   │   └── index.ts             # 常量配置
│   ├── utils/
│   │   └── api.ts               # API 请求与测试逻辑
│   ├── hooks/
│   │   ├── useApiStore.ts       # localStorage 数据持久化
│   │   └── useApiTest.ts        # 测试状态管理
│   └── components/
│       ├── ApiCard.tsx           # API 信息卡片
│       ├── ApiDetailDialog.tsx   # API 详情对话框
│       ├── ApiFormDialog.tsx     # 添加/编辑弹窗
│       ├── BatchImportDialog.tsx # 批量导入弹窗
│       ├── TestResultPanel.tsx   # 测试结果面板
│       └── ApiListHeader.tsx     # 顶部操作栏
├── proxy-server.js              # CORS 代理服务器
├── vite.config.ts               # Vite 配置
├── package.json                 # 项目配置
└── tsconfig.json                # TypeScript 配置
```

## NPM Scripts

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Web 开发服务器 |
| `npm run build` | 构建 Web 生产版本 |
| `npm run electron:dev` | 启动 Electron 桌面开发模式 |
| `npm run electron:build` | 构建并打包 Electron 应用 |
| `npm run dist` | 构建 Windows 安装包（NSIS） |
| `npm run dist:portable` | 构建 Windows 便携版 |

## 推荐资源

### 硅基流动 SiliconFlow — 推荐注册

通过以下邀请链接注册**硅基流动（SiliconFlow）**，被邀请者和邀请者均可获得 **免费 API 使用代金券**：

| 推荐方式 | 链接 |
|:---|:---|
| 邀请链接 | [https://cloud.siliconflow.cn/i/vDdG58RW](https://cloud.siliconflow.cn/i/vDdG58RW) |

> 硅基流动提供 OpenAI、DeepSeek、Qwen、Llama 等主流大模型的高性价比 API 服务，支持免科学上网访问，是国内使用 AI API 的优质选择。

## 开发计划

- [ ] 支持自定义测试端点（不仅限于 `/models`）
- [ ] 定时自动巡检
- [ ] 测试历史记录与趋势图
- [ ] API Key 加密存储
- [ ] 多语言支持
- [ ] macOS / Linux 桌面版支持

## License

MIT
