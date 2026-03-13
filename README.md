# copilot-mini

> **cassec-copilot-server 的学习版本** — 保留核心架构，省略生产环境复杂度。

---

## 项目介绍

copilot-mini 是 [cassec-copilot-server](https://github.com/casstime/cassec-copilot-server) 的精简学习版本，用于理解 Copilot 架构的核心设计。

**原项目特点：**
- 14+ 个 AI 应用（GarageAssistant、CarGPT、ProRag...）
- Apollo Config + Eureka + MongoDB
- SSE/Polling 实时推送
- 复杂的 Agent 编排和工具调用

**Mini 版本特点：**
- ✅ 保留核心架构：Copilot → Application → Agent → Context
- ✅ 1 个应用（GarageAssistant）+ 2 个 Agent（inquiry、fallback）
- ✅ 内存存储（Map），无数据库依赖
- ✅ 同步返回，无 SSE
- ✅ 代码简洁，易于学习

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务

```bash
npm run dev
```

服务启动在 **http://localhost:54321**

### 3. 测试接口

```bash
curl -X POST http://localhost:54321/copilot/hook \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "appId": "GarageAssistant",
    "message": {
      "type": "text",
      "content": "帮我询价轮胎"
    }
  }'
```

**响应示例：**

```json
{
  "replies": [
    {
      "type": "text",
      "content": "好的，请告诉我您需要的轮胎规格...",
      "fromUser": "system"
    }
  ]
}
```

---

## 目录结构

```
copilot-mini/
├── src/
│   ├── main.ts                    # 启动入口
│   ├── routes/
│   │   └── index.ts               # 路由定义（/copilot/hook + /health）
│   ├── copilot/
│   │   ├── copilot.ts             # Copilot 核心类
│   │   ├── Application.ts         # Application 类
│   │   ├── Agent.ts               # Agent 基类
│   │   ├── index.ts               # bindCopilot（路由绑定）
│   │   ├── apps/
│   │   │   └── GarageAssistant/   # 智能采购助手应用
│   │   │       ├── index.ts       # 应用定义
│   │   │       └── agents/
│   │   │           ├── inquiry/   # 询价 Agent
│   │   │           └── fallback/  # 兜底 Agent
│   │   ├── tools/                 # 工具集
│   │   ├── services/              # 业务服务
│   │   ├── helpers/               # 辅助函数
│   │   └── constants/             # 常量定义
│   ├── storage/
│   │   └── index.ts               # 内存存储（Map）
│   ├── types.ts                   # 类型定义
│   └── common/                    # 公共模块
│       ├── logger/                # 日志
│       ├── clients/               # HTTP 客户端
│       └── utils/                 # 工具函数
├── ARCHITECTURE.md                # 架构说明
├── QUICKSTART.md                  # 快速上手
└── package.json
```

### 与原项目目录对应关系

| Mini 版本 | 原项目 | 说明 |
|-----------|--------|------|
| `src/main.ts` | `src/main.ts` | 启动入口（省略 Apollo/Eureka/MongoDB） |
| `src/routes/index.ts` | `src/routes/index.ts` | 路由（只保留 /copilot/hook + /health） |
| `src/copilot/copilot.ts` | `src/copilot/copilot.ts` | Copilot 核心类（简化版） |
| `src/copilot/Application.ts` | `@casstime/copilot-core` | Application 类 |
| `src/copilot/Agent.ts` | `@casstime/copilot-core` | Agent 基类 |
| `src/copilot/apps/GarageAssistant/` | `src/copilot/apps/GarageAssistant/` | 智能采购助手（只保留 2 个 Agent） |
| `src/storage/index.ts` | `src/copilot/storage.ts` | 存储（原项目用 MongoDB，mini 用 Map） |

---

## 核心概念

### 1. Copilot

总控制器，管理所有 Application。

```typescript
// src/copilot/copilot.ts
const copilot = new Copilot({ storage });
copilot.registerApplication(garageAssistantApp);
```

**对应原项目：** `@casstime/copilot-core` 的 Copilot 类

### 2. Application

应用（如 GarageAssistant），包含多个 Agent。

```typescript
// src/copilot/apps/GarageAssistant/index.ts
const app = new Application(AppId.GarageAssistant, {
  name: "智能采购助手",
  description: "帮助用户发布询价单并解答汽配相关问题。",
});

app.setClassifier(classifier);
app.registerAgent(inquiryAgent);
app.registerAgent(fallbackAgent, { fallback: true });
```

**对应原项目：** `@casstime/copilot-core` 的 Application 类

### 3. Agent

场景处理器（如 inquiry、fallback）。

```typescript
// src/copilot/apps/GarageAssistant/agents/inquiry/index.ts
const agent = new Agent(AgentId.inquiryAgent, {
  name: "询价助手",
  description: "帮助用户发布询价单",
});

agent.setIntentParser(async (ctx) => {
  ctx.setIntent("发布询价");
});

agent.handle(["发布询价"], async (ctx) => {
  ctx.reply({ type: "text", content: "请告诉我配件名称..." });
});
```

**对应原项目：** `@casstime/copilot-core` 的 Agent 类

### 4. Context

会话上下文（历史消息、槽位、意图）。

```typescript
interface IContext {
  sessionId: string;
  appName: string;
  lastMessage: IMessage;
  historyMessages: IMessage[];
  slots: Record<string, unknown>;
  
  setIntent(intent: string): void;
  getIntent(): string;
  reply(message: IMessage): void;
  activateAgent(agentId: string | null): Promise<void>;
}
```

**对应原项目：** `@casstime/copilot-core` 的 IContext 接口

---

## 扩展示例

### 添加新 Agent

```typescript
// src/copilot/apps/GarageAssistant/agents/myAgent/index.ts
import { Agent } from "../../../Agent";
import { AgentId } from "../../../constants";

const myAgent = new Agent(AgentId.myAgent, {
  name: "我的 Agent",
  description: "自定义功能",
});

myAgent.setIntentParser(async (ctx) => {
  ctx.setIntent("自定义意图");
});

myAgent.handle(["自定义意图"], async (ctx) => {
  ctx.reply({ type: "text", content: "处理自定义逻辑..." });
});

export default myAgent;
```

然后在 `src/copilot/apps/GarageAssistant/index.ts` 中注册：

```typescript
import myAgent from "./agents/myAgent";
app.registerAgent(myAgent);
```

### 添加新 Application

```typescript
// src/copilot/apps/MyApp/index.ts
import { Application } from "../../Application";

const myApp = new Application("MyApp", {
  name: "我的应用",
  description: "自定义应用",
});

// 注册 Agent...
export default myApp;
```

然后在 `src/copilot/copilot.ts` 中注册：

```typescript
import myApp from "./apps/MyApp";
copilot.registerApplication(myApp);
```

---

## 接口说明

### POST /copilot/hook

消息入口，处理用户消息。

**请求参数：**

```typescript
{
  sessionId: string;    // 会话 ID（用于区分不同用户）
  appId: string;        // 应用 ID（如 "GarageAssistant"）
  message: {
    type: string;       // 消息类型（"text" | "image" | ...）
    content: string;    // 消息内容
  }
}
```

**响应：**

```typescript
{
  replies: Array<{
    type: string;       // 消息类型
    content: string;    // 消息内容
    fromUser: string;   // "system" | "user"
  }>
}
```

### GET /health

健康检查。

**响应：**

```json
{
  "status": "ok",
  "timestamp": "2026-03-13T06:27:14.648Z"
}
```

---

## 学习路径

1. **阅读 ARCHITECTURE.md** — 理解架构设计和与原项目的对比
2. **阅读 QUICKSTART.md** — 快速上手，理解核心流程
3. **调试代码** — 在 `src/copilot/copilot.ts` 打断点，跟踪消息流转
4. **扩展功能** — 添加新 Agent、新 Application
5. **对比原项目** — 看原项目如何实现 SSE、MongoDB、多应用等

---

## 参考资料

- **原项目：** `/Users/hehongyu/project/cassec-copilot-server`
- **核心库：** `@casstime/copilot-core`（原项目依赖）
- **架构文档：** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **快速上手：** [QUICKSTART.md](./QUICKSTART.md)

---

## License

MIT
