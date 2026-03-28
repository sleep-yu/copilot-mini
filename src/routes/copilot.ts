import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { aiService } from "../service/ai.service";

interface CopilotPayload {
  app?: string;
  sessionId?: string;
  data: {
    fromUser?: string;
    type?: string;
    content?: string;
    dialogueId?: string;
    nlu?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

const copilotHookSchema = {
  body: {
    type: "object",
    required: ["data"],
    properties: {
      app: { type: "string" },
      sessionId: { type: "string" },
      data: {
        type: "object",
        required: ["fromUser", "content"],
        properties: {
          fromUser: { type: "string" },
          type: { type: "string" },
          content: { type: "string" },
          dialogueId: { type: "string" },
          nlu: { type: "object" },
          metadata: { type: "object" },
        },
      },
      metadata: { type: "object" },
    },
  },
};

async function copilotHook(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.body as CopilotPayload;
  const { app, data } = payload;
  const fromUser = data.fromUser || "anonymous";
  const content = data.content || "";

  if (!content.trim()) {
    return reply.send({
      sessionId: payload.sessionId || "",
      messages: [],
    });
  }

  // 调用 AI 生成回复
  const result = await aiService.ask({
    userId: fromUser,
    message: content,
  });

  const messages = [];

  // 用户消息
  messages.push({
    id: new Date().getTime().toString(),
    type: data.type || "text",
    fromUser,
    toUser: "system",
    content,
    createdAt: Date.now(),
  });

  // AI 回复
  messages.push({
    id: (Date.now() + 1).toString(),
    type: "text",
    fromUser: "system",
    toUser: fromUser,
    content: result.ok && result.content ? result.content : result.error || "抱歉，服务暂时不可用。",
    createdAt: Date.now(),
  });

  return reply.send({
    sessionId: payload.sessionId || "",
    messages,
  });
}

export default async function copilotRoutes(server: FastifyInstance) {
  server.post('/copilot/hook', { schema: copilotHookSchema }, copilotHook);
}
