import { FastifyInstance, FastifyReply } from "fastify";
import { sessionService } from "../service/session.service";
import { aiService } from "../service/ai.service";
import { authMiddleware } from "../middleware/auth";

interface SessionParams {
  id: string;
}

interface UpdateSessionBody {
  title: string;
}

interface ListQuery {
  page?: string;
  pageSize?: string;
}

export default async function sessionRoutes(server: FastifyInstance) {
  server.get<{ Querystring: ListQuery }>("/", {
    preHandler: authMiddleware,
  }, async (request, reply: FastifyReply) => {
    const userId = request.user!.userId;
    const { page, pageSize } = request.query;
    const result = await sessionService.list(userId, {
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });
    return reply.send(result);
  });

  server.post<{ Body: { title?: string } }>("/", {
    preHandler: authMiddleware,
  }, async (request, reply: FastifyReply) => {
    const userId = request.user!.userId;
    const result = await sessionService.create(userId, { title: request.body.title || "新对话" });
    return reply.code(201).send(result);
  });

  server.get<{ Params: SessionParams }>("/:id", {
    preHandler: authMiddleware,
  }, async (request, reply: FastifyReply) => {
    const userId = request.user!.userId;
    const { id } = request.params;
    const result = await sessionService.getById(userId, id);
    if (!result.ok) {
      return reply.code(404).send(result);
    }
    return reply.send(result);
  });

  server.put<{ Params: SessionParams; Body: UpdateSessionBody }>("/:id", {
    preHandler: authMiddleware,
  }, async (request, reply: FastifyReply) => {
    const userId = request.user!.userId;
    const { id } = request.params;
    const { title } = request.body;
    const result = await sessionService.update(userId, id, title);
    if (!result.ok) {
      return reply.code(404).send(result);
    }
    return reply.send(result);
  });

  server.delete<{ Params: SessionParams }>("/:id", {
    preHandler: authMiddleware,
  }, async (request, reply: FastifyReply) => {
    const userId = request.user!.userId;
    const { id } = request.params;
    const result = await sessionService.delete(userId, id);
    if (!result.ok) {
      return reply.code(404).send(result);
    }
    return reply.send({ ok: true });
  });

  // 流式发送消息：POST /sessions/:id/messages
  server.post<{ Params: SessionParams; Body: { content: string; enableThinking?: boolean } }>(
    "/:id/messages",
    {
      schema: {
        body: {
          type: "object",
          required: ["content"],
          properties: {
            content: { type: "string" },
            enableThinking: { type: "boolean" },
          },
        },
      },
      preHandler: authMiddleware,
    },
    async (request, reply: FastifyReply) => {
      const userId = request.user!.userId;
      const { id: sessionId } = request.params;
      const { content, enableThinking } = request.body;

      await sessionService.addUserMessage(userId, sessionId, content);

      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        "Access-Control-Allow-Origin": "*",
      });

      let fullContent = "";
      const messageId = `msg-${Date.now()}`;

      try {
        for await (const chunk of aiService.askStream({ userId, message: content, enableThinking })) {
          if (chunk.content) {
            fullContent += chunk.content;
          }
          const data = `data: ${JSON.stringify({ id: messageId, role: "assistant", content: fullContent })}\n\n`;
          reply.raw.write(data);
        }
        await sessionService.saveAssistantMessage(userId, sessionId, messageId, fullContent);
      } catch (err) {
        console.error("AI 流式请求失败:", err);
        reply.raw.write(`data: ${JSON.stringify({ error: true, content: "抱歉，服务暂时不可用。" })}\n\n`);
      }

      reply.raw.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      reply.raw.end();
    }
  );
}
