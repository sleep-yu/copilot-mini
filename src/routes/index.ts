// ===========================
// HTTP 路由
// 对应原项目：src/routes/index.ts
//
// 原项目有几十个路由，这里只保留核心的 copilot hook + health
// ===========================

import { Application } from "express";
import { bindCopilot } from "../copilot";

export function bindRoutes(app: Application) {
  // copilot 消息入口（原项目 bindCopilot("/copilot/hook", server)）
  bindCopilot(app);

  // 健康检查
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
}
