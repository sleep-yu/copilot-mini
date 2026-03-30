import { Session } from "../model/Session";
import { Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";

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
      title: dto.title || "新对话",
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

  /**
   * 写用户消息入库（流开始时调用）
   */
  async addUserMessage(userId: string, sessionId: string, content: string) {
    const message = {
      id: MESSAGE_ID_PREFIX + uuidv4().replace(/-/g, "").slice(0, 12),
      role: "user" as const,
      content,
      timestamp: Date.now(),
    };
    const result = await Session.updateOne(
      { _id: new Types.ObjectId(sessionId), userId: new Types.ObjectId(userId) },
      { $push: { messages: message }, $set: { updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) throw new Error("会话不存在或无权访问");
    return message;
  },

  /**
   * 边收边存助手消息（每个 AI chunk 都调用）
   * 首次调用时创建 message，后续调用更新 content
   */
  async saveAssistantMessage(userId: string, sessionId: string, messageId: string, content: string) {
    const session = await Session.findOne({
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
    });
    if (!session) throw new Error("会话不存在或无权访问");

    const existingIdx = session.messages.findIndex((m) => m.id === messageId);
    if (existingIdx === -1) {
      session.messages.push({ id: messageId, role: "assistant" as const, content, timestamp: Date.now() });
    } else {
      session.messages[existingIdx].content = content;
      session.messages[existingIdx].timestamp = Date.now();
    }
    session.updatedAt = new Date();
    await session.save();
  },

};
