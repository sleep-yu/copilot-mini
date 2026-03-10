# Copilot Mini - 最小化学习版本

这是一个最小化的 copilot-server 学习项目，帮助理解核心架构。

## 📁 项目结构

```
src/
├── core/              # 核心类
│   ├── Copilot.ts    # Copilot 主类
│   ├── Application.ts # 应用类
│   └── BaseAgent.ts   # Agent 基类
├── agents/            # Agent 实现
│   └── SimpleQAAgent.ts
├── apps/              # 应用实例
│   └── assistant.ts
├── routes/            # API 路由
│   └── index.ts
├── types.ts           # 类型定义
├── copilot.ts         # Copilot 实例
└── main.ts            # 入口文件
```

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

### 3. 测试接口

**发送消息**：
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "appName": "assistant",
    "userId": "user123",
    "message": "你好"
  }'
```

**健康检查**：
```bash
curl http://localhost:3000/health
```

## 🎯 核心概念

### 1. Copilot
- 管理多个 Application
- 路由消息到对应的应用

### 2. Application
- 代表一个具体的应用（如：采购助手、问答助手）
- 包含多个 Agent

### 3. Agent
- 处理具体的业务逻辑
- 接收 Context，返回 Response

### 4. Context
- 包含对话历史、用户信息等

## 📝 扩展示例

### 添加新的 Agent

```typescript
// src/agents/MyAgent.ts
import { BaseAgent } from '../core/BaseAgent';
import { Context, AgentResponse } from '../types';

export class MyAgent extends BaseAgent {
  constructor() {
    super('MyAgent');
  }

  async handle(context: Context): Promise<AgentResponse> {
    return { content: '我的回复' };
  }
}
```

### 注册到应用

```typescript
// src/apps/assistant.ts
import { MyAgent } from '../agents/MyAgent';

assistantApp.registerAgent(new MyAgent());
```

## 🔍 与原项目对比

| 原项目 | Mini版本 | 说明 |
|--------|---------|------|
| 14个应用 | 1个应用 | 简化为单个助手应用 |
| MongoDB | 无数据库 | 内存存储 |
| LangChain | 规则匹配 | 简化AI逻辑 |
| 复杂路由 | 2个接口 | 只保留核心接口 |

## 💡 学习路径

1. ✅ 理解 Copilot → Application → Agent 的层级关系
2. ✅ 看懂消息如何从路由流转到 Agent
3. ⬜ 添加自己的 Agent 实现
4. ⬜ 添加新的 Application
5. ⬜ 集成真实的 AI 模型（OpenAI）
6. ⬜ 添加数据库存储

## 🎓 下一步

- 添加表单填充功能（参考原项目的 InquiryForm）
- 添加按钮交互
- 集成 OpenAI API
- 添加消息历史存储
