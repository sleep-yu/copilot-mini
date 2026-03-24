import { FastifyInstance } from "fastify";
import healthHandler from "./health";
import { bindCopilot } from "@/copilot";
import { bindAuthRoutes } from "@/route/auth";
import { bindSessionRoutes } from "@/route/session";

export const bindRoutes = (server: FastifyInstance) => {
  bindCopilot('/copilot/hook', server);
  server.get('/health', healthHandler);
  bindAuthRoutes(server);
  bindSessionRoutes(server);
}
