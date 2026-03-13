// ===========================
// 应用入口
// 对应原项目的 main.ts / app.ts
// ===========================

import fastify from "fastify";
import { bindRoutes } from "./routes";

const server = fastify({ logger: true });

bindRoutes(server);

const PORT = Number(process.env.PORT) || 38888;
server.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
  console.log(`  POST /copilot/hook  - 消息入口`);
  console.log(`  GET  /health        - 健康检查`);
});
