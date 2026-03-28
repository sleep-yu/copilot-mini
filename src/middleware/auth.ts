import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { getEnvConfig } from "../common/utils/env";
import { fail, ErrorCode } from "../utils/response";

const JWT_SECRET = (() => {
  const secret = getEnvConfig("JWT_SECRET") as string;
  if (!secret) {
    throw new Error("JWT_SECRET not configured");
  }
  return secret;
})();

export interface JwtPayload {
  userId: string;
  email: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return fail(reply, ErrorCode.UNAUTHORIZED, "未登录或Token无效", 401);
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    request.user = payload;
  } catch {
    return fail(reply, ErrorCode.UNAUTHORIZED, "Token无效或已过期", 401);
  }
};
