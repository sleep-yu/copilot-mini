import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
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

export async function sessionRoutes(server: FastifyInstance) {
  server.get("/sessions", {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest<{ Querystring: ListQuery }>, reply: FastifyReply) => {
    const userId = request.user!.userId;
    const { page, pageSize } = request.query;
    const result = await sessionService.list(userId, {
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });
    return reply.send(result);
  });

  server.post("/sessions", {
    preHandler: authMiddleware,
  }, async (request: FastifyRequest<{ Body: { title?: string } }>, reply: FastifyReply) => {
    const userId = request.user!.userId;
    const result = await sessionService.create(userId, request.body);
    return reply.code(201).send(result);
  });

  server.get<{ Params: SessionParams }>("/sessions/:id", {
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

  server.put<{ Params: SessionParams; Body: UpdateSessionBody }>("/sessions/:id", {
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

  server.delete<{ Params: SessionParams }>("/sessions/:id", {
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
  server.post<{ Params: SessionParams; Body: { content: string } }>(
    "/sessions/:id/messages",
    {
      schema: {
        body: {
          type: "object",
          required: ["content"],
          properties: {
            content: { type: "string" },
          },
        },
      },
      preHandler: authMiddleware,
    },
    async (request, reply: FastifyReply) => {
      const userId = request.user!.userId;
      const { id: sessionId } = request.params;
      const { content } = request.body;

      // 1. 写用户消息入库
      await sessionService.addUserMessage(userId, sessionId, content);

      // 2. 设置 SSE 响应头
      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        "Access-Control-Allow-Origin": "*",
      });

      // 3. 调 AI 流式 API，边收边存边推
      let fullContent = "";
      const messageId = `msg-${Date.now()}`;

      try {
        for await (const chunk of aiService.askStream({ userId, message: content })) {
          fullContent += chunk;
          // 边存
          await sessionService.saveAssistantMessage(userId, sessionId, messageId, fullContent);
          // 边推：完整累积内容
          reply.raw.write(`data: ${JSON.stringify({ id: messageId, role: "assistant", content: fullContent })}\n\n`);
        }
      } catch (err) {
        console.error("AI 流式请求失败:", err);
        reply.raw.write(`data: ${JSON.stringify({ error: true, content: "抱歉，服务暂时不可用。" })}\n\n`);
      }

      // 4. 流结束，推送 done 信号
      reply.raw.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      reply.raw.end();
    }
  );
}
