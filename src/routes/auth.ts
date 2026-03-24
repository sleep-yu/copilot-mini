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

async function register(request: FastifyRequest, reply: FastifyReply) {
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
}

async function login(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = request.body as { email: string; password: string };

  const result = await authService.login({ email, password });
  if (!result.ok) {
    return fail(reply, ErrorCode.UNAUTHORIZED, result.error, 401);
  }
  return success(reply, result.data, "登录成功");
}

async function getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const result = await authService.getCurrentUser(userId);
  if (!result.ok) {
    return fail(reply, ErrorCode.NOT_FOUND, result.error, 404);
  }
  return success(reply, result.data);
}

async function logout(_request: FastifyRequest, reply: FastifyReply) {
  return success(reply, undefined, "登出成功");
}

export default async function authRoutes(server: FastifyInstance) {
  server.post('/register', { schema: registerSchema }, register);
  server.post('/login', { schema: loginSchema }, login);
  server.get('/me', { preHandler: authMiddleware }, getCurrentUser);
  server.post('/logout', { preHandler: authMiddleware }, logout);
}
