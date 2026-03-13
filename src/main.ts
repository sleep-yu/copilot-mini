// ===========================
// 应用入口
// 对应原项目的 main.ts / app.ts
// ===========================

import express from "express";
import { bindRoutes } from "./routes";

const app = express();
app.use(express.json());

bindRoutes(app);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`[copilot-mini] 服务启动，监听 http://localhost:${PORT}`);
  console.log(`  POST /copilot/hook  - 消息入口`);
  console.log(`  GET  /health        - 健康检查`);
});
