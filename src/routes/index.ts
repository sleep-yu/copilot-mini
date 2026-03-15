import { FastifyInstance } from "fastify";
import healthHandler from "./health";
import { bindCopilot } from "@/copilot";

export const bindRoutes = (server: FastifyInstance) => {
  bindCopilot('/copilot/hook', server);
  server.get('/health', healthHandler);
}