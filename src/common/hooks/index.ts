import { FastifyInstance } from "fastify";
import { wrapperHandler } from "./wrapper";
import { errorHandler } from './error'

export const bindHooks = (server: FastifyInstance) => {
  // 响应序列化之前触发，这里包装了出参的统一格式
  server.addHook("preSerialization", wrapperHandler);
  server.setErrorHandler(errorHandler);
}