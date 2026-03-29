import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { sessionService } from "../service/session.service";
import { aiService } from "../service/ai.service";
import { authMiddleware } from "../middleware/auth";
import { success, created, fail, ErrorCode } from "../utils/response";

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
  const { id: sessionId } = request.params as SessionParams;
  const { content } = request.body as { content: string };

  // 1. 写用户消息入库
  await sessionService.addUserMessage(userId, sessionId, content);

  // 2. 设置 SSE 响应头
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // 3. 调 AI 流式 API，边收边存边推
  let fullContent = '';
  const messageId = `msg-${Date.now()}`;

  try {
    for await (const chunk of aiService.askStream({ userId, message: content })) {
      fullContent += chunk;
      // 边存：每个 chunk 都更新数据库
      await sessionService.saveAssistantMessage(userId, sessionId, messageId, fullContent);
      // 边推：推送完整累积内容（容错，前端直接覆盖）
      reply.raw.write(`data: ${JSON.stringify({ id: messageId, role: 'assistant', content: fullContent })}\n\n`);
    }
  } catch (err) {
    console.error('AI 流式请求失败:', err);
    reply.raw.write(`data: ${JSON.stringify({ error: true, content: '抱歉，服务暂时不可用。' })}\n\n`);
  }

  // 4. 流结束，推送 done 信号
  reply.raw.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  reply.raw.end();
}


export default async function sessionRoutes(server: FastifyInstance) {
  server.addHook('preHandler', authMiddleware);

  // 获取会话列表
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

  // 创建会话
  server.post('/', {
    schema: {
      body: {
        type: "object",
        required: [],  // title 改为可选
        properties: {
          title: { type: "string", maxLength: 100, default: "新对话" },
        },
      },
    },
  }, createSession);

  // 查询会话
  server.get('/:id', getSession);

  // 修改会话
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

  // 删除会话
  server.delete('/:id', deleteSession);

  // 向指定会话发送消息（流式）
  server.post('/:id/messages', {
    schema: {
      body: {
        type: "object",
        required: ["content"],
        properties: {
          content: { type: "string" },
        },
      },
    },
  }, addMessage);

}
