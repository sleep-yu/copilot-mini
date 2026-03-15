import { FastifyInstance } from "fastify";
import healthHandler from "./health";

export const bindRoutes = (server: FastifyInstance) => {
  server.get('health', healthHandler)
}