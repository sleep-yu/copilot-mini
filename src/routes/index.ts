import { FastifyInstance } from "fastify";
import healthHandler from "./health";
import authRoutes from "./auth";
import sessionRoutes from "./session";
import copilotRoutes from "./copilot";

export const bindRoutes = (server: FastifyInstance) => {
  server.get('/health', healthHandler);
  server.register(authRoutes, { prefix: '/api/auth' });
  server.register(sessionRoutes, { prefix: '/api/sessions' });
  server.register(copilotRoutes);
}
