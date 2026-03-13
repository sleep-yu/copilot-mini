// ===========================
// bindCopilot
// 对应原项目：src/copilot/index.ts
//
// 原项目：将 copilot 绑定到 Fastify 实例上（注册路由）
// 这里简化为导出一个注册函数供 routes 使用
// ===========================

import { Application as ExpressApp } from "express";
import copilot from "./copilot";

/**
 * 将 copilot 绑定到 Express 路由
 * 原项目：bindCopilot(path, fastifyServer) → new CopilotServer(server, path) → copilot.attach(serverForCopilot)
 *
 * 原项目的 CopilotServer 实现了 IServer 接口，包含：
 *   - onPayload: 接收消息，触发 copilot 处理
 *   - send: 将回复消息存入数据库 + 推送给客户端（polling 或 SSE）
 *
 * 这里直接在路由层调用 copilot.handleMessage，省略 IServer 中间层
 */
export function bindCopilot(app: ExpressApp) {
  app.post("/copilot/hook", async (req, res) => {
    const { sessionId, appId, message } = req.body as {
      sessionId: string;
      appId: string;
      message: { content: string; type?: string };
    };

    if (!sessionId || !appId || !message) {
      return res.status(400).json({ error: "缺少必要参数: sessionId, appId, message" });
    }

    const replies = await copilot.handleMessage(sessionId, appId, {
      type: (message.type as any) ?? "text",
      content: message.content,
      fromUser: "user",
      createdAt: Date.now(),
    });

    return res.json({ replies });
  });
}
