# 架构说明

## 📊 核心架构图

```
┌─────────────────────────────────────────┐
│           HTTP Request                   │
│      POST /chat                          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Routes (路由层)                  │
│  - 解析请求参数                          │
│  - 调用 Copilot                          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Copilot (核心调度)               │
│  - 管理所有 Application                  │
│  - 根据 appName 路由到对应应用           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Application (应用层)               │
│  - 管理多个 Agent                        │
│  - 选择合适的 Agent 处理                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Agent (业务逻辑层)               │
│  - 处理具体业务逻辑                      │
│  - 返回响应内容和按钮                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Response                         │
│  { content, actions }                    │
└─────────────────────────────────────────┘
```

## 🔄 消息流转过程

### 1. 用户发送消息
```json
{
  "appName": "assistant",
  "userId": "user123",
  "message": "你好"
}
```

### 2. 路由层处理
- 验证参数
- 调用 `copilot.chat()`

### 3. Copilot 调度
- 根据 `appName` 找到对应的 Application
- 构建 Context 对象

### 4. Application 处理
- 选择合适的 Agent（当前简化为第一个）
- 调用 `agent.handle(context)`

### 5. Agent 处理
- 分析用户消息
- 执行业务逻辑
- 返回响应

### 6. 返回结果
```json
{
  "content": "你好！我是智能助手",
  "actions": [
    { "label": "查询配件", "type": "query" },
    { "label": "联系客服", "type": "contact" }
  ]
}
```

## 🎯 与原项目的对应关系

### 原项目结构
```
src/
├── copilot/
│   ├── apps/              # 14个应用
│   │   ├── GarageAssistant/
│   │   │   ├── agents/    # 多个Agent
│   │   │   │   ├── inquiry/
│   │   │   │   ├── products/
│   │   │   │   └── ...
│   │   ├── StoreHouse/
│   │   └── ...
│   ├── copilot.ts         # Copilot实例
│   └── storage.ts         # 存储层
├── routes/                # 路由
└── main.ts                # 入口
```

### Mini版本结构
```
src/
├── core/                  # 核心类（简化）
│   ├── Copilot.ts
│   ├── Application.ts
│   └── BaseAgent.ts
├── apps/                  # 1个应用
│   └── assistant.ts
├── agents/                # 1个Agent
│   └── SimpleQAAgent.ts
├── routes/                # 路由
├── copilot.ts             # Copilot实例
└── main.ts                # 入口
```

## 💡 关键设计模式

### 1. 分层架构
- **路由层**: 处理HTTP请求
- **调度层**: Copilot 负责应用路由
- **应用层**: Application 管理 Agent
- **业务层**: Agent 处理具体逻辑

### 2. 策略模式
- 每个 Agent 是一个策略
- Application 根据情况选择 Agent

### 3. 工厂模式
- Application 作为 Agent 的工厂
- Copilot 作为 Application 的工厂

## 🔧 扩展点

### 1. 添加更多 Agent
```typescript
class InquiryAgent extends BaseAgent {
  // 处理询价逻辑
}

class ProductAgent extends BaseAgent {
  // 处理产品查询
}
```

### 2. 添加 Agent 路由逻辑
```typescript
class Application {
  async process(context: Context) {
    // 根据意图选择 Agent
    const intent = this.classifyIntent(context);
    const agent = this.selectAgent(intent);
    return await agent.handle(context);
  }
}
```

### 3. 添加中间件
```typescript
class Copilot {
  middlewares: Middleware[] = [];
  
  async chat(...) {
    // 执行中间件
    for (const mw of this.middlewares) {
      await mw(context);
    }
    // 处理消息
  }
}
```

## 📚 学习建议

1. **先运行起来**: `npm run dev`
2. **发送测试消息**: 用 curl 或 Postman
3. **修改 SimpleQAAgent**: 添加自己的规则
4. **创建新 Agent**: 实现不同的功能
5. **对比原项目**: 看看原项目是怎么做的
