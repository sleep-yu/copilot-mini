import { Session } from "../model/Session";
import { Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { aiService } from "./ai.service";

const MESSAGE_ID_PREFIX = "msg-";

export interface CreateSessionDto {
  title: string;
}

export interface AddMessageDto {
  role: "user" | "assistant";
  content: string;
}

export interface ListSessionsQuery {
  page?: number;
  pageSize?: number;
}

export const sessionService = {
  async list(userId: string, query: ListSessionsQuery = {}) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const total = await Session.countDocuments({ userId: new Types.ObjectId(userId) });

    const sessions = await Session.find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .select("title messages createdAt updatedAt");

    return {
      ok: true,
      data: {
        sessions: sessions.map((s) => ({
          id: s._id.toString(),
          title: s.title,
          messageCount: s.messages.length,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
        pagination: { page, pageSize, total },
      },
    };
  },

  async create(userId: string, dto: CreateSessionDto) {
    const session = await Session.create({
      userId: new Types.ObjectId(userId),
      title: dto.title || '新对话',
      messages: [],
    });

    return {
      ok: true,
      data: {
        id: session._id.toString(),
        title: session.title,
        messages: session.messages,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      },
    };
  },

  async getById(userId: string, sessionId: string) {
    const session = await Session.findOne({
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
    });

    if (!session) {
      return { ok: false, error: "会话不存在或无权访问" } as const;
    }

    return {
      ok: true,
      data: {
        id: session._id.toString(),
        title: session.title,
        messages: session.messages,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      },
    };
  },

  async update(userId: string, sessionId: string, title: string) {
    const result = await Session.updateOne(
      { _id: new Types.ObjectId(sessionId), userId: new Types.ObjectId(userId) },
      { title }
    );

    if (result.matchedCount === 0) {
      return { ok: false, error: "会话不存在或无权访问" } as const;
    }

    return { ok: true };
  },

  async delete(userId: string, sessionId: string) {
    const result = await Session.deleteOne({
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      return { ok: false, error: "会话不存在或无权访问" } as const;
    }

    return { ok: true };
  },

  async addMessage(userId: string, sessionId: string, dto: AddMessageDto) {
    const message = {
      id: MESSAGE_ID_PREFIX + uuidv4().replace(/-/g, "").slice(0, 12),
      role: dto.role,
      content: dto.content,
      timestamp: Date.now(),
    };

    const result = await Session.updateOne(
      { _id: new Types.ObjectId(sessionId), userId: new Types.ObjectId(userId) },
      {
        $push: { messages: message },
        $set: { updatedAt: new Date() },
      }
    );

    if (result.matchedCount === 0) {
      return { ok: false, error: "会话不存在或无权访问" } as const;
    }

    // 如果是用户消息，调用 AI 生成回复
    if (dto.role === 'user') {
      const aiResult = await aiService.ask({ userId, message: dto.content });
      const assistantMessage = {
        id: MESSAGE_ID_PREFIX + uuidv4().replace(/-/g, "").slice(0, 12),
        role: 'assistant',
        content: aiResult.ok && aiResult.content ? aiResult.content : (aiResult.error || '抱歉，服务暂时不可用。'),
        timestamp: Date.now(),
      };
      await Session.updateOne(
        { _id: new Types.ObjectId(sessionId) },
        {
          $push: { messages: assistantMessage },
          $set: { updatedAt: new Date() },
        }
      );
      return { ok: true, data: { user: message, assistant: assistantMessage } };
    }

    return { ok: true, data: message };
  },

  async clearMessages(userId: string, sessionId: string) {
    const result = await Session.updateOne(
      { _id: new Types.ObjectId(sessionId), userId: new Types.ObjectId(userId) },
      { $set: { messages: [], updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return { ok: false, error: "会话不存在或无权访问" } as const;
    }

    return { ok: true };
  },
};
