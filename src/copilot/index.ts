import { FastifyInstance } from "fastify";
import copilot from "./copilot";
import CopilotServer from "./server/CopilotServer";

export function bindCopilot(path: string, server: FastifyInstance) {
  const serverForCopilot = new CopilotServer(server, path);
  copilot.attach(serverForCopilot);
}