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

async function listSessions(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const query = request.query as ListQuery;
  const page = query.page ? parseInt(String(query.page)) : 1;
  const pageSize = query.pageSize ? parseInt(String(query.pageSize)) : 20;
  const result = await sessionService.list(userId, { page, pageSize });
  return success(reply, result.data);
}

async function createSession(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const { title } = request.body as { title: string };
  const result = await sessionService.create(userId, { title });
  return created(reply, result.data, "创建成功");
}

async function getSession(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const { id } = request.params as SessionParams;
  const result = await sessionService.getById(userId, id);
  if (!result.ok) {
    return fail(reply, ErrorCode.NOT_FOUND, result.error!, 404);
  }
  return success(reply, result.data);
}

async function updateSession(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const { id } = request.params as SessionParams;
  const { title } = request.body as UpdateSessionBody;
  const result = await sessionService.update(userId, id, title);
  if (!result.ok) {
    return fail(reply, ErrorCode.NOT_FOUND, result.error!, 404);
  }
  return success(reply, undefined, "更新成功");
}

async function deleteSession(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const { id } = request.params as SessionParams;
  const result = await sessionService.delete(userId, id);
  if (!result.ok) {
    return fail(reply, ErrorCode.NOT_FOUND, result.error!, 404);
  }
  return success(reply, undefined, "删除成功");
}

async function addMessage(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const { id } = request.params as SessionParams;
  const { role, content } = request.body as AddMessageBody;
  const result = await sessionService.addMessage(userId, id, { role, content });
  if (!result.ok) {
    return fail(reply, ErrorCode.NOT_FOUND, result.error!, 404);
  }
  return created(reply, result.data);
}

async function clearMessages(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.userId;
  const { id } = request.params as SessionParams;
  const result = await sessionService.clearMessages(userId, id);
  if (!result.ok) {
    return fail(reply, ErrorCode.NOT_FOUND, result.error!, 404);
  }
  return success(reply, undefined, "消息已清空");
}

export default async function sessionRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authMiddleware);

  server.get('/', {
    schema: {
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1, default: 1 },
          pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
      },
    },
  }, listSessions);

  server.post('/', {
    schema: {
      body: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", maxLength: 100 },
        },
      },
    },
  }, createSession);

  server.get('/:id', getSession);

  server.put('/:id', {
    schema: {
      body: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", maxLength: 100 },
        },
      },
    },
  }, updateSession);

  server.delete('/:id', deleteSession);

  server.post('/:id/messages', {
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
  }, addMessage);

  server.delete('/:id/messages', clearMessages);
}
