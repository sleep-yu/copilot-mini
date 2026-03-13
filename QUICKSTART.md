# QUICKSTART.md - 快速上手

> 5 分钟理解 copilot-mini 的核心流程。

---

## 启动步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务

```bash
npm run dev
```

**预期输出：**

```
Server listening at http://0.0.0.0:54321
  POST /copilot/hook  - 消息入口
  GET  /health        - 健康检查
[Copilot] 注册应用: GarageAssistant (智能采购助手)
```

---

## 接口测试

### 测试 1：询价场景

```bash
curl -X POST http://localhost:54321/copilot/hook \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-001",
    "appId": "GarageAssistant",
    "message": {
      "type": "text",
      "content": "我想买刹车片"
    }
  }'
```

**响应：**

```json
{
  "replies": [
    {
      "type": "text",
      "content": "好的，请告诉我您需要的配件信息...",
      "fromUser": "system"
    }
  ]
}
```

**流程说明：**
1. 消息进入 `inquiryAgent`
2. `setIntentParser` 识别关键词"刹车"，设置意图为"买配件"
3. 调用 `handleBuyParts` 处理器
4. 返回引导文案

### 测试 2：兜底场景

```bash
curl -X POST http://localhost:54321/copilot/hook \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-002",
    "appId": "GarageAssistant",
    "message": {
      "type": "text",
      "content": "今天天气怎么样"
    }
  }'
```

**响应：**

```json
{
  "replies": [
    {
      "type": "markdown",
      "content": "您好，我是智能采购助手。\n\n您的问题：「今天天气怎么样」\n\n很抱歉暂时无法精确回答，建议您点击「人工客服」获取帮助。",
      "fromUser": "system"
    }
  ]
}
```

**流程说明：**
1. 消息进入 `inquiryAgent`
2. `setIntentParser` 无法识别关键词，设置意图为 `FALLBACK_SYMBOL`
3. `inquiryAgent` 的兜底处理器调用 `context.activateAgent(fallbackAgent)`
4. 切换到 `fallbackAgent` 处理
5. 返回兜底回复

---

## 核心文件说明

### 1. 启动入口

**文件：** `src/main.ts`

**对应原项目：** `src/main.ts`（省略 Apollo/Eureka/MongoDB）

```typescript
import fastify from "fastify";
import { bindRoutes } from "./routes";

const server = fastify({ logger: true });
bindRoutes(server);

const PORT = Number(process.env.PORT) || 54321;
server.listen({ port: PORT, host: "0.0.0.0" });
```

### 2. 路由定义

**文件：** `src/routes/index.ts`

**对应原项目：** `src/routes/index.ts`（只保留 /copilot/hook + /health）

```typescript
export function bindRoutes(app: FastifyInstance) {
  bindCopilot(app);  // 注册 /copilot/hook
  
  app.get("/health", async (_request, reply) => {
    reply.send({ status: "ok", timestamp: new Date().toISOString() });
  });
}
```

### 3. Copilot 路由绑定

**文件：** `src/copilot/index.ts`

**对应原项目：** `src/copilot/index.ts` + `src/copilot/server/CopilotServer.ts`（省略 SSE/Polling）

```typescript
export function bindCopilot(app: FastifyInstance) {
  app.post("/copilot/hook", async (req, reply) => {
    const { sessionId, appId, message } = req.body;
    
    // 调用 copilot 处理消息
    const replies = await copilot.handleMessage(sessionId, appId, {
      type: message.type ?? "text",
      content: message.content,
      fromUser: "user",
      createdAt: Date.now(),
    });
    
    return reply.send({ replies });
  });
}
```

### 4. Copilot 核心类

**文件：** `src/copilot/copilot.ts`

**对应原项目：** `@casstime/copilot-core` 的 Copilot 类

**核心方法：**

```typescript
async handleMessage(sessionId: string, appId: string, message: IMessage) {
  // 1. 从 storage 加载会话上下文
  const contextData = await this.storage.getItemAsync(sessionId);
  
  // 2. 构建 RuntimeContext
  const context = new RuntimeContext(contextData, message);
  
  // 3. 执行 onContextInitialized 钩子
  if (this.contextInitializedHook) {
    await this.contextInitializedHook(context);
  }
  
  // 4. 找到对应 Application
  const app = this.applications.get(appId);
  
  // 5. 应用处理消息
  await app.handle(context);
  
  // 6. 持久化更新后的 context
  await this.storage.setItemAsync(sessionId, context.toContextData());
  
  // 7. 返回本轮回复
  return context.getReplies();
}
```

### 5. Application 类

**文件：** `src/copilot/Application.ts`

**对应原项目：** `@casstime/copilot-core` 的 Application 类

**核心方法：**

```typescript
async handle(context: IContext) {
  // 1. 执行路由前中间件
  if (this.beforeRouteHook) {
    await this.beforeRouteHook(context);
  }
  
  // 2. 用分类器决定路由到哪个 Agent
  let targetAgentId = await this.classifier?.classify(context);
  
  const agent = this.agents.get(targetAgentId) ?? this.fallbackAgent;
  
  // 3. 调用 Agent 处理
  await agent.process(context);
}
```

### 6. Agent 类

**文件：** `src/copilot/Agent.ts`

**对应原项目：** `@casstime/copilot-core` 的 Agent 类

**核心方法：**

```typescript
async process(context: IContext) {
  this.enterHook?.();
  
  // 1. 执行意图解析器
  if (this.intentParser) {
    await this.intentParser(context);
  }
  
  // 2. 根据意图找到对应处理器
  const intent = context.getIntent();
  const handler = this.handlers.get(intent) ?? this.fallbackHandler;
  
  // 3. 执行处理器
  if (handler) {
    await handler(context);
  }
  
  this.leaveHook?.();
}
```

### 7. GarageAssistant 应用

**文件：** `src/copilot/apps/GarageAssistant/index.ts`

**对应原项目：** `src/copilot/apps/GarageAssistant/index.ts`（只保留 2 个 Agent）

```typescript
const app = new Application(AppId.GarageAssistant, {
  name: "智能采购助手",
  description: "帮助用户发布询价单并解答汽配相关问题。",
});

// 设置场景分类器（原项目用 LLM，这里固定路由到 inquiryAgent）
app.setClassifier({
  id: "SCENE_CLASSIFIER",
  classify: async () => AgentId.inquiryAgent,
});

// 注册 Agent
app.registerAgent(inquiryAgent);
app.registerAgent(fallbackAgent, { fallback: true });
```

### 8. inquiry Agent

**文件：** `src/copilot/apps/GarageAssistant/agents/inquiry/index.ts`

**对应原项目：** `src/copilot/apps/GarageAssistant/agents/inquiry/agent/index.ts`（原项目是 LLMAgent）

```typescript
const agent = new Agent(AgentId.inquiryAgent, {
  name: "询价 Agent",
  description: "处理用户的配件询价请求，引导用户发布询价单。",
});

// 意图解析器（原项目用 LLM，这里用关键词规则）
agent.setIntentParser(async (context) => {
  const text = context.lastMessage.content ?? "";
  
  if (/配件|刹车|机油|轮胎|询价/.test(text)) {
    context.setIntent(Intents.buyParts);
  } else if (/订单|查单/.test(text)) {
    context.setIntent("查订单");
  } else {
    context.setIntent(FALLBACK_SYMBOL);
  }
});

// 注册意图处理器
agent.handle([Intents.buyParts], handleBuyParts);
agent.handle(["查订单"], handleCheckOrder);
agent.handle([FALLBACK_SYMBOL], async (context) => {
  await context.activateAgent(AgentId.fallbackAgent);
});
```

### 9. fallback Agent

**文件：** `src/copilot/apps/GarageAssistant/agents/fallback/index.ts`

**对应原项目：** `src/copilot/apps/GarageAssistant/agents/fallback/index.ts`（原项目调用 LLM 流式生成）

```typescript
const agent = new Agent(AgentId.fallbackAgent, {
  name: "兜底回复 Agent",
  description: "处理其他所有 Agent 无法处理的问题。",
});

agent.handle([Intents.askQuestion, FALLBACK_SYMBOL], async (context) => {
  const { lastMessage } = context;
  
  // 原项目这里调用 LLM 生成流式回复
  context.reply({
    type: "markdown",
    content: `您好，我是智能采购助手。\n\n您的问题：「${lastMessage.content}」\n\n很抱歉暂时无法精确回答，建议您点击「人工客服」获取帮助。`,
    fromUser: "system",
  });
});
```

### 10. 存储

**文件：** `src/storage/index.ts`

**对应原项目：** `src/copilot/storage.ts`（原项目用 MongoDB，这里用 Map）

```typescript
const memoryStorage = new Map<string, IContextData>();

export const storage: IStorage = {
  async getItemAsync(sessionId: string) {
    return memoryStorage.get(sessionId) ?? {
      sessionId,
      appName: "",
      historyMessages: [],
      slots: {},
    };
  },
  
  async setItemAsync(sessionId: string, data: IContextData) {
    memoryStorage.set(sessionId, data);
  },
};
```

---

## 学习建议

### 1. 理解消息流转

在 `src/copilot/copilot.ts` 的 `handleMessage` 方法打断点，跟踪一条消息的完整流程：

```
用户消息
  ↓
Copilot.handleMessage()
  ↓
Application.handle()
  ↓
Agent.process()
  ↓
意图解析器 (setIntentParser)
  ↓
意图处理器 (handle)
  ↓
context.reply()
  ↓
返回回复
```

### 2. 对比原项目

| 功能 | Mini 版本 | 原项目 |
|------|-----------|--------|
| 意图识别 | 关键词规则 | LLM 分类 |
| 场景分类 | 固定路由 | LLM 分类 |
| 回复生成 | 固定文案 | LLM 流式生成 |
| 存储 | Map | MongoDB |
| 推送 | 同步返回 | SSE/Polling |

### 3. 扩展练习

1. **添加新意图：** 在 `inquiry Agent` 中添加"查物流"意图
2. **添加新 Agent：** 创建 `productAgent` 处理商品推荐
3. **替换存储：** 将 Map 替换为 Redis
4. **添加 LLM：** 用 OpenAI API 替换关键词规则

### 4. 阅读原项目

理解 mini 版本后，阅读原项目的这些部分：

1. `src/copilot/server/CopilotServer.ts` — SSE/Polling 实现
2. `src/copilot/apps/GarageAssistant/agents/inquiry/agent/index.ts` — LLMAgent 实现
3. `src/copilot/tools/` — 工具调用（搜索、数据库、API）
4. `src/copilot/apps/` — 其他 13 个应用的实现

---

## 常见问题

### Q1: 为什么没有 SSE/Polling？

**A:** Mini 版本简化为同步返回，原项目用 SSE/Polling 实现实时推送。

**原项目实现：**
```typescript
// src/copilot/server/CopilotServer.ts
class CopilotServer {
  send(sessionId, message) {
    // 1. 存入数据库
    await saveMessage(sessionId, message);
    
    // 2. 推送给客户端（SSE 或 Polling）
    this.sseManager.push(sessionId, message);
  }
}
```

### Q2: 为什么只有 2 个 Agent？

**A:** 原项目的 GarageAssistant 有 6 个 Agent（inquiry、fallback、partInfo、background、products、tyre），mini 版本只保留核心的 inquiry + fallback。

### Q3: 如何添加 LLM？

**A:** 在 `setIntentParser` 和 `handle` 中调用 LLM API：

```typescript
agent.setIntentParser(async (context) => {
  const intent = await callLLM(context.lastMessage.content);
  context.setIntent(intent);
});

agent.handle(["买配件"], async (context) => {
  const reply = await callLLM(`用户说：${context.lastMessage.content}`);
  context.reply({ type: "text", content: reply });
});
```

### Q4: 如何持久化到数据库？

**A:** 替换 `src/storage/index.ts`：

```typescript
export const storage: IStorage = {
  async getItemAsync(sessionId: string) {
    const doc = await CopilotSession.findOne({ sessionId });
    return doc?.toObject() ?? { sessionId, appName: "", historyMessages: [], slots: {} };
  },
  
  async setItemAsync(sessionId: string, data: IContextData) {
    await CopilotSession.updateOne({ sessionId }, data, { upsert: true });
  },
};
```

---

## 下一步

- 阅读 [ARCHITECTURE.md](./ARCHITECTURE.md) 理解架构设计
- 阅读 [README.md](./README.md) 了解扩展方法
- 对比原项目代码，理解生产环境的复杂度

---

## 参考资料

- **原项目：** `/Users/hehongyu/project/cassec-copilot-server`
- **核心库：** `@casstime/copilot-core`
