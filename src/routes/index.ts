// ===========================
// HTTP 路由
// 对应原项目：src/routes/index.ts
//
// 原项目有几十个路由，这里只保留核心的 copilot hook + health
// ===========================

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { bindCopilot } from "../copilot";

export function bindRoutes(app: FastifyInstance) {
  // copilot 消息入口（原项目 bindCopilot("/copilot/hook", server)）
  bindCopilot(app);

  // 健康检查
  app.get("/health", async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.send({ status: "ok", timestamp: new Date().toISOString() });
  });
}
