import { FastifyInstance } from "fastify";
import { bindCopilot } from "@/copilot";
import healthHandler from "./health";
import authRoutes from "./auth";
import sessionRoutes from "./session";

export const bindRoutes = (server: FastifyInstance) => {
  bindCopilot('/copilot/hook', server);
  server.get('/health', healthHandler);
  server.register(authRoutes, { prefix: '/api/auth' });
  server.register(sessionRoutes, { prefix: '/api/sessions' });
}
