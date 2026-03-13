# 🚀 快速启动指南

## 第一步：安装依赖

```bash
npm install
```

## 第二步：启动服务

```bash
npm run dev
```

看到这个输出说明启动成功：
```
🚀 Server running at http://localhost:3000
```

## 第三步：测试

### 方式1：使用测试脚本（推荐）
```bash
./test.sh
```

### 方式2：手动测试
```bash
# 测试问候
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"appName":"assistant","userId":"user123","message":"你好"}'
```

## 🎯 核心文件说明

| 文件 | 作用 |
|------|------|
| `src/main.ts` | 入口文件，启动 Fastify 服务器 |
| `src/copilot.ts` | Copilot 实例，注册应用 |
| `src/core/Copilot.ts` | Copilot 核心类 |
| `src/core/Application.ts` | 应用类 |
| `src/core/BaseAgent.ts` | Agent 基类 |
| `src/agents/SimpleQAAgent.ts` | 简单问答 Agent |
| `src/apps/assistant.ts` | 助手应用实例 |
| `src/routes/index.ts` | API 路由 |

## 📖 阅读顺序建议

1. **先看架构**: `ARCHITECTURE.md` - 理解整体架构
2. **看类型定义**: `src/types.ts` - 了解数据结构
3. **看核心类**: 
   - `src/core/BaseAgent.ts` - Agent 基类
   - `src/core/Application.ts` - 应用类
   - `src/core/Copilot.ts` - Copilot 类
4. **看实现**:
   - `src/agents/SimpleQAAgent.ts` - Agent 实现
   - `src/apps/assistant.ts` - 应用实例
5. **看入口**:
   - `src/routes/index.ts` - 路由
   - `src/copilot.ts` - Copilot 实例
   - `src/main.ts` - 启动文件

## 💡 动手练习

### 练习1：修改回复内容
修改 `src/agents/SimpleQAAgent.ts`，改变回复内容

### 练习2：添加新规则
在 `SimpleQAAgent` 中添加新的关键词匹配

### 练习3：创建新 Agent
参考 `SimpleQAAgent`，创建一个新的 Agent

### 练习4：添加新应用
创建一个新的 Application，注册到 Copilot

## 🔍 对比学习

打开原项目对应文件，对比学习：

| Mini版本 | 原项目 |
|---------|--------|
| `src/core/Copilot.ts` | `src/copilot/copilot.ts` |
| `src/agents/SimpleQAAgent.ts` | `src/copilot/apps/GarageAssistant/agents/inquiry/` |
| `src/routes/index.ts` | `src/routes/index.ts` |

## ❓ 常见问题

**Q: 端口被占用怎么办？**
A: 修改 `src/main.ts` 中的 `PORT` 变量

**Q: 如何添加日志？**
A: Fastify 自带日志，在代码中使用 `console.log`

**Q: 如何调试？**
A: 使用 VSCode 的调试功能，或者添加 `console.log`
