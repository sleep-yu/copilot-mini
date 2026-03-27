import { Session } from "@/model/Session";
import { Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import config from 'config'

const MESSAGE_ID_PREFIX = "msg-";
const COPROCESSOR_HOST = 'http://localhost:62345';

// 调用 copilot hook 接口生成回复
async function generateAIResponse(userId: string, userMessage: string): Promise<string> {
  try {
    const response = await fetch(`${COPROCESSOR_HOST}/copilot/hook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app: "QUESTION_ANSWER",
        data: {
          fromUser: userId,
          type: "text",
          content: userMessage
        }
      })
    });
    const result = await response.json();
    console.log('Copilot Hook 返回:', JSON.stringify(result, null, 2));

    if (!result.data?.messages || result.data.messages.length === 0) {
      return '抱歉，服务暂时不可用，请稍后再试。';
    }

    // 找到 AI 的回复（fromUser 为 system）
    const aiMessage = result.data.messages.find((m: any) => m.fromUser === 'system');
    return aiMessage?.content || '抱歉，我没有理解您的问题。';
  } catch (error) {
    console.error('调用 Copilot Hook 失败:', error);
    return '抱歉，服务暂时不可用，请稍后再试。';
  }
}

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
      title: dto.title || '新对话',  // 默认标题
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
      const aiResponse = await generateAIResponse(userId, dto.content);
      const assistantMessage = {
        id: MESSAGE_ID_PREFIX + uuidv4().replace(/-/g, "").slice(0, 12),
        role: 'assistant',
        content: aiResponse,
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
