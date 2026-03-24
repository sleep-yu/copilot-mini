import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { sessionService } from "@/service/session.service";
import { authMiddleware } from "@/middleware/auth";
import { success, created, fail, ErrorCode } from "@/utils/response";

interface SessionParams {
  id: string;
}

interface UpdateSessionBody {
  title: string;
}

interface AddMessageBody {
  role: "user" | "assistant";
  content: string;
}

interface ListQuery {
  page?: string;
  pageSize?: string;
}

export const bindSessionRoutes = (server: FastifyInstance) => {
  // All session routes require auth
  server.addHook("preHandler", authMiddleware);

  // GET /api/sessions - List sessions
  server.get("/api/sessions", {
    schema: {
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1, default: 1 },
          pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
      },
    },
  }, async (request: FastifyRequest<{ Querystring: ListQuery }>, reply: FastifyReply) => {
    const userId = request.user!.userId;
    const page = request.query.page ? parseInt(String(request.query.page)) : 1;
    const pageSize = request.query.pageSize ? parseInt(String(request.query.pageSize)) : 20;
    const result = await sessionService.list(userId, { page, pageSize });
    return success(reply, result.data);
  });

  // POST /api/sessions - Create session
  server.post("/api/sessions", {
    schema: {
      body: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", maxLength: 100 },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: { title: string } }>, reply: FastifyReply) => {
    const userId = request.user!.userId;
    const { title } = request.body;
    const result = await sessionService.create(userId, { title });
    return created(reply, result.data, "创建成功");
  });

  // GET /api/sessions/:id - Get session detail
  server.get<{ Params: SessionParams }>("/api/sessions/:id", async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params;
    const result = await sessionService.getById(userId, id);
    if (!result.ok) {
      return fail(reply, ErrorCode.NOT_FOUND, result.error!, 404);
    }
    return success(reply, result.data);
  });

  // PUT /api/sessions/:id - Update session
  server.put<{ Params: SessionParams; Body: UpdateSessionBody }>("/api/sessions/:id", {
    schema: {
      body: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", maxLength: 100 },
        },
      },
    },
  }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params;
    const { title } = request.body;
    const result = await sessionService.update(userId, id, title);
    if (!result.ok) {
      return fail(reply, ErrorCode.NOT_FOUND, result.error!, 404);
    }
    return success(reply, undefined, "更新成功");
  });

  // DELETE /api/sessions/:id - Delete session
  server.delete<{ Params: SessionParams }>("/api/sessions/:id", async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params;
    const result = await sessionService.delete(userId, id);
    if (!result.ok) {
      return fail(reply, ErrorCode.NOT_FOUND, result.error!, 404);
    }
    return success(reply, undefined, "删除成功");
  });

  // POST /api/sessions/:id/messages - Add message
  server.post<{ Params: SessionParams; Body: AddMessageBody }>("/api/sessions/:id/messages", {
    schema: {
      body: {
        type: "object",
        required: ["role", "content"],
        properties: {
          role: { type: "string", enum: ["user", "assistant"] },
          content: { type: "string" },
        },
      },
    },
  }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params;
    const { role, content } = request.body;
    const result = await sessionService.addMessage(userId, id, { role, content });
    if (!result.ok) {
      return fail(reply, ErrorCode.NOT_FOUND, result.error!, 404);
    }
    return created(reply, result.data);
  });

  // DELETE /api/sessions/:id/messages - Clear messages
  server.delete<{ Params: SessionParams }>("/api/sessions/:id/messages", async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params;
    const result = await sessionService.clearMessages(userId, id);
    if (!result.ok) {
      return fail(reply, ErrorCode.NOT_FOUND, result.error!, 404);
    }
    return success(reply, undefined, "消息已清空");
  });
};
