# ARCHITECTURE.md - 架构说明

> **核心定位：** copilot-mini 是 cassec-copilot-server 的学习版本，保留核心架构，省略生产环境复杂度。

---

## 架构对比

### 原项目（cassec-copilot-server）

```
┌─────────────────────────────────────────────────────────────┐
│                     cassec-copilot-server                    │
├─────────────────────────────────────────────────────────────┤
│  Fastify Server (Port 22345)                                │
│  ├─ Apollo Config (配置中心)                                 │
│  ├─ Eureka (服务注册)                                        │
│  ├─ MongoDB (会话持久化)                                     │
│  ├─ SSE / Polling (实时推送)                                 │
│  └─ 14+ Applications (GarageAssistant, CarGPT, ProRag...)   │
│     └─ 每个 App 包含多个 Agent (inquiry, fallback, ...)     │
└─────────────────────────────────────────────────────────────┘
```

### Mini 版本（copilot-mini）

```
┌─────────────────────────────────────────────────────────────┐
│                        copilot-mini                          │
├─────────────────────────────────────────────────────────────┤
│  Fastify Server (Port 54321)                                │
│  ├─ 内存存储 (Map)                                           │
│  ├─ 同步返回 (无 SSE)                                        │
│  └─ 1 个 Application (GarageAssistant)                      │
│     └─ 2 个 Agent (inquiry, fallback)                       │
└─────────────────────────────────────────────────────────────┘
```

**简化内容：**
- ❌ Apollo Config / Eureka / MongoDB
- ❌ SSE / Polling 实时推送
- ❌ 多应用支持（只保留 GarageAssistant）
- ❌ 复杂 Agent（只保留 inquiry + fallback）
- ✅ 保留核心架构：Copilot → Application → Agent → Context

---

## 目录结构对比

### 原项目目录

```
cassec-copilot-server/
├── src/
│   ├── main.ts                    # 启动入口（Apollo + Eureka + MongoDB）
│   ├── routes/                    # 路由（几十个接口）
│   ├── copilot/
│   │   ├── copilot.ts             # Copilot 核心类
│   │   ├── server/                # CopilotServer（SSE/Polling）
│   │   ├── apps/                  # 14+ 个应用
│   │   │   ├── GarageAssistant/   # 智能采购助手（6 个 Agent）
│   │   │   ├── CarGPT/            # 汽车 GPT
│   │   │   ├── ProRag/            # RAG 应用
│   │   │   └── ...
│   │   ├── tools/                 # 工具集（LLM、搜索、数据库）
│   │   └── services/              # 业务服务
│   ├── models/                    # MongoDB 模型
│   └── common/                    # 公共模块
```

### Mini 版本目录

```
copilot-mini/
├── src/
│   ├── main.ts                    # 启动入口（仅 Fastify）
│   ├── routes/
│   │   └── index.ts               # 路由（/copilot/hook + /health）
│   ├── copilot/
│   │   ├── copilot.ts             # Copilot 核心类（简化版）
│   │   ├── Application.ts         # Application 类
│   │   ├── Agent.ts               # Agent 基类
│   │   ├── index.ts               # bindCopilot（路由绑定）
│   │   ├── apps/
│   │   │   └── GarageAssistant/   # 唯一应用（2 个 Agent）
│   │   │       ├── index.ts       # 应用定义
│   │   │       └── agents/
│   │   │           ├── inquiry/   # 询价 Agent
│   │   │           └── fallback/  # 兜底 Agent
│   │   ├── tools/                 # 工具集（简化）
│   │   ├── services/              # 业务服务（简化）
│   │   └── helpers/               # 辅助函数
│   ├── storage/
│   │   └── index.ts               # 内存存储（Map）
│   ├── types.ts                   # 类型定义
│   └── common/                    # 公共模块
```

---

## 消息流转

### 1. 用户发送消息

```bash
POST http://localhost:54321/copilot/hook
Content-Type: application/json

{
  "sessionId": "session-123",
  "appId": "GarageAssistant",
  "message": {
    "type": "text",
    "content": "帮我询价轮胎"
  }
}
```

### 2. 流程图

```
┌──────────────┐
│  POST /hook  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  src/copilot/index.ts: bindCopilot()                     │
│  - 解析请求参数 (sessionId, appId, message)              │
│  - 调用 copilot.handleMessage()                          │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  src/copilot/copilot.ts: Copilot.handleMessage()        │
│  1. 从 storage 加载会话上下文 (historyMessages, slots)   │
│  2. 构建 RuntimeContext                                  │
│  3. 执行 onContextInitialized 钩子                       │
│  4. 找到对应 Application                                 │
│  5. 调用 app.handle(context)                             │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  src/copilot/Application.ts: Application.handle()       │
│  1. 执行 onBeforeRoute 中间件                            │
│  2. 用 classifier 决定路由到哪个 Agent                   │
│  3. 调用 agent.process(context)                          │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  src/copilot/Agent.ts: Agent.process()                  │
│  1. 执行 onBeforeProcess 中间件                          │
│  2. 调用 handler(context) 处理消息                       │
│  3. context.reply() 添加回复消息                         │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  返回到 Copilot.handleMessage()                          │
│  1. 持久化更新后的 context 到 storage                    │
│  2. 返回 context.getReplies()                            │
└──────┬───────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  返回 HTTP 响应                                           │
│  { "replies": [{ "type": "text", "content": "..." }] }  │
└──────────────────────────────────────────────────────────┘
```

### 3. 核心概念

| 概念 | 说明 | 对应原项目 |
|------|------|-----------|
| **Copilot** | 总控制器，管理所有 Application | `@casstime/copilot-core` 的 Copilot 类 |
| **Application** | 应用（如 GarageAssistant），包含多个 Agent | `@casstime/copilot-core` 的 Application 类 |
| **Agent** | 场景处理器（如 inquiry、fallback） | `@casstime/copilot-core` 的 Agent 类 |
| **Context** | 会话上下文（历史消息、槽位、意图） | `@casstime/copilot-core` 的 IContext 接口 |
| **Classifier** | 场景分类器，决定路由到哪个 Agent | 原项目用 LLM 分类，mini 版本固定路由 |
| **Storage** | 会话存储（原项目用 MongoDB，mini 用 Map） | `src/copilot/storage.ts` |

---

## 原项目省略的部分

### 1. CopilotServer（SSE/Polling）

**原项目：**
```typescript
// src/copilot/server/CopilotServer.ts
class CopilotServer implements IServer {
  onPayload(payload) {
    // 接收消息，触发 copilot 处理
  }
  
  send(sessionId, message) {
    // 将回复存入数据库 + 推送给客户端（SSE 或 Polling）
  }
}
```

**Mini 版本：**
- 直接在路由层调用 `copilot.handleMessage()`
- 同步返回结果，无 SSE/Polling

### 2. MongoDB 持久化

**原项目：**
```typescript
// src/models/CopilotSession.ts
const CopilotSessionSchema = new Schema({
  sessionId: String,
  appName: String,   // 内部存储字段，非接口参数（标识会话所属应用，由服务端写入）
  historyMessages: Array,
  slots: Object,
});
```

**Mini 版本：**
```typescript
// src/storage/index.ts
const storage = new Map<string, IContextData>();
```

### 3. Apollo Config + Eureka

**原项目：**
```typescript
// src/main.ts
await apolloConfig();
await loadSpringConfig({ ... });
getEurekaClient().start();
```

**Mini 版本：**
- 无配置中心，直接用环境变量
- 无服务注册

### 4. 多应用支持

**原项目：** 14+ 个应用（GarageAssistant、CarGPT、ProRag...）

**Mini 版本：** 只保留 GarageAssistant

---

## 学习建议

1. **先理解 mini 版本的核心流程**（Copilot → Application → Agent → Context）
2. **对比原项目代码**，看每个类对应 `@casstime/copilot-core` 的哪个部分
3. **扩展 mini 版本**：
   - 添加新 Agent（参考 inquiry/fallback）
   - 添加新 Application（参考 GarageAssistant）
   - 替换 Storage 为 MongoDB
   - 添加 SSE 推送

---

## 参考资料

- 原项目：`/Users/hehongyu/project/cassec-copilot-server`
- Mini 版本：`/Users/hehongyu/myownProject/copilot-mini`
- 核心库：`@casstime/copilot-core`（原项目依赖）
