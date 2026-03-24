import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authService } from "@/service/auth.service";
import { authMiddleware } from "@/middleware/auth";
import { success, created, fail, ErrorCode } from "@/utils/response";

const registerSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
      nickname: { type: "string", maxLength: 50 },
    },
  },
};

const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string" },
    },
  },
};

export const bindAuthRoutes = (server: FastifyInstance) => {
  // POST /api/auth/register
  server.post("/api/auth/register", { schema: registerSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password, nickname } = request.body as {
      email: string;
      password: string;
      nickname?: string;
    };

    const result = await authService.register({ email, password, nickname });
    if (!result.ok) {
      return fail(reply, ErrorCode.BAD_REQUEST, result.error, 400);
    }
    return created(reply, result.data, "注册成功");
  });

  // POST /api/auth/login
  server.post("/api/auth/login", { schema: loginSchema }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = request.body as { email: string; password: string };

    const result = await authService.login({ email, password });
    if (!result.ok) {
      return fail(reply, ErrorCode.UNAUTHORIZED, result.error, 401);
    }
    return success(reply, result.data, "登录成功");
  });

  // GET /api/auth/me
  server.get("/api/auth/me", { preHandler: authMiddleware }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user!.userId;
    const result = await authService.getCurrentUser(userId);
    if (!result.ok) {
      return fail(reply, ErrorCode.NOT_FOUND, result.error, 404);
    }
    return success(reply, result.data);
  });

  // POST /api/auth/logout
  server.post("/api/auth/logout", { preHandler: authMiddleware }, async (_request: FastifyRequest, reply: FastifyReply) => {
    return success(reply, undefined, "登出成功");
  });
};
