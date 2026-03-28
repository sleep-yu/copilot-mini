import { FastifyReply } from "fastify";

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

export const success = <T>(reply: FastifyReply, data?: T, message = "操作成功") => {
  return reply.status(200).send({ code: 0, message, data });
};

export const created = <T>(reply: FastifyReply, data?: T, message = "创建成功") => {
  return reply.status(201).send({ code: 0, message, data });
};

export const fail = (
  reply: FastifyReply,
  code: number,
  message: string,
  statusCode: number = 400
) => {
  // 4xx/5xx 错误走 errorCode 字段，前端直接用 errorCode 判断
  // 确保 HTTP 状态码不被 preSerialization 链覆盖
  reply.statusCode = statusCode;
  return reply.send({ errorCode: statusCode, code, message, data: null });
};

export const ErrorCode = {
  SUCCESS: 0,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
} as const;
