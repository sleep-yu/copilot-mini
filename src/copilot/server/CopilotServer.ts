import { FastifyInstance } from "fastify";
import { IServer } from "@/interface/network";
import { useRequestMeta } from "@/common/asyncStore";
import { ICommandMessage, IPayload, IMessage } from "@/interface/messages";
import { AppId } from "@/common/enums/AppId";
import { AgentId, VersionEnum } from "@/common/enums";
import { createObjectId, parseUserAgent } from "@/common/utils";
import { Version } from "@/common/utils";
import { ISocket } from "@/interface/IServer";
import { Dialogue } from "@/model/Dialogue";
import { AppMap } from "@/common/enums/AppId";
import { Intents } from "../constants/Intents";
import { sleep } from "@/common/utils";
import { RequestStatus } from "@/model/RequestStatus";
import { CopilotMessage, ICopilotMessage } from "@/model/CopilotMessage";
import _ from 'lodash';
import dayjs from 'dayjs';
import { Types } from "mongoose";
import { sendPollingErrorToWechat } from "@/common/utils/wechat";
import { ContextValue, IContextValue } from "@/model/ContextValue";
import { Session } from "@/interface/session/Session";
import { storage } from "../storage";
import MessageProcessor from "./MessageProcessor";
import CopilotSocket from "./CopilotSocket";

type PayloadCallback = Parameters<IServer["onPayload"]>[0];
interface IDoPollingParams {
  sessionId: string;
  requestId: string;
  updatedAt: number;
}

export interface IParamsSchema {
  Body: {
    sessionId?: string;
    data: unknown;
  };
}

export const opts = {
  schema: {
    body: {
      type: "object",
      required: ["data"],
      properties: {
        sessionId: { type: "string" },
        data: { type: "object" },
      },
    },
  },
};

class CopilotServer implements IServer {
  // 用于存储回调函数的私有属性，类型为 PayloadCallback 或 undefined
  private payloadCallback?: PayloadCallback;

  constructor(
    private server: FastifyInstance,
    path: string
  ) {
    this.server.post<IParamsSchema>(path, opts, async (req, reply) => {
      const { requestId } = useRequestMeta();
      const payload = req.body as IPayload || AppId.Question_Answer;
      payload.app = payload.app;
      const { app, companyId } = payload;
      const fromMessage = this.exactFromMessage(payload);
      const userId = fromMessage.fromUser;
      let sessionId = payload.sessionId;
      // 获取app版本号
      payload.headers = req.headers;
      const userAgent = payload.headers['user-agent'];
      const { appVersion, containerId, platform } = parseUserAgent(userAgent || "");
      payload.appVersion = new Version(appVersion || VersionEnum.MAX_VERSION);
      payload.containerId = containerId;
      payload.platform = platform;
      let socket: ISocket | undefined = undefined;
      try {
        const dialogues = await Dialogue.find({ userId, app, companyId }).exec();
        const dialogueIds = dialogues.map((d) => d._id.toString());
        // 会话不存在，则重新创建会话
        if (!fromMessage.dialogueId ||
          !/^[0-9a-f]{24}$/.test(fromMessage.dialogueId) ||
          !dialogueIds.includes(fromMessage.dialogueId)
        ) {
          const displayName = AppMap[app as keyof typeof AppMap];
          const dialogue = await Dialogue.findOneAndUpdate(
            { userId, app, companyId, businessId: "DEFAULT" },
            { $set: { displayName } },
            { upsert: true, new: true }
          )
            .sort({ updateAt: -1 })
            .exec();
          fromMessage.dialogueId = dialogue.id.toString();
        }

        // 处理流式轮询消息，直接返回消息列表，不进入后续流程
        if (this.isPollingCommand(fromMessage)) {
          const messages = await this.doPolling(fromMessage.params);
          reply.send({
            sessionId,
            messages,
          });

          return reply;
        }
        if (!userId) throw new Error('缺少 fromUser');
        const dialogueId = fromMessage.dialogueId;
        let condition: Partial<IContextValue> = { userId, app };
        if (dialogueId) {
          condition = { dialogueId };
        }
        // 查询最新的sessionId
        const beforeContextValue = await ContextValue.findOne(condition, { _id: 0, id: 0 })
          .sort({ updatedAt: -1 })
          .exec();
        sessionId = beforeContextValue?.sessionId;
        const session = new Session({ app, userId, sessionId, dialogueId, storage, createId: createObjectId });
        await session.loadContextData();
        sessionId = session.sessionId;
        // 保存用户信息
        const msg = await CopilotMessage.create({
          ...fromMessage,
          sessionId,
          dialogueId,
          toUser: "system",
          metadata: (fromMessage as any).metadata || payload.metadata,
          id: undefined,
          _id: undefined,
          createdAt: undefined,
          requestId,
        })
        // 保存后的消息包含id，便于后续业务使用
        payload.data = msg.toJSON();
        const appVersion = payload.appVersion as Version;
        const containerId = payload.containerId as string;
        socket = new CopilotSocket({
          sessionId,
          fromMessage: msg,
          reply,
          replyMode: payload.replyMode || "block",
          requestId,
          messageProcessor: new MessageProcessor({ appVersion, containerId }),
        });
      } catch (error) {

      }
    })
  }

  /**
   * 判断是否为轮询命令
   * @param fromMessage
   * @returns
   */
  isPollingCommand(fromMessage: IMessage): fromMessage is ICommandMessage {
    return (
      fromMessage.type === "command" &&
      fromMessage.command === Intents.pollingStreamMsg &&
      fromMessage.params?.requestId
    );
  }

  /**
   * 处理轮询请求的方法
   * @param params 包含 sessionId、requestId 和 updatedAt 的参数对象
   * @returns 返回消息数组 **
   */
  async doPolling(params: IDoPollingParams) {
    // 从参数中解构出 sessionId、requestId 和 updatedAt
    const { sessionId, requestId, updatedAt } = params;
    // 只查3分钟之内的消息
    const TIME_LIMIT = 3 * 60 * 1000;
    // 计算3分钟前的时间戳
    const createdAfter = new Date().getTime() - TIME_LIMIT;
    // 延迟100毫秒
    await sleep(100);
    // 并行执行两个查询：请求状态和消息文档
    const [requestStatus, messageDocs] = await Promise.all([
      RequestStatus.findOne({ requestId }).lean(), // 查询请求是否结束
      // 查询符合条件的消息文档
      CopilotMessage.find({
        sessionId,
        requestId,
        fromUser: "system",
        createdAt: { $gt: createdAfter },
      }),
    ]);
    // 将消息文档转换为 ICopilotMessage 数组
    const messages: ICopilotMessage[] = messageDocs.map((msgdoc) => msgdoc.toJSON());
    // 如果有消息且请求未结束
    if (messages.length && requestStatus && !requestStatus.done) {
      // 取出回复消息中最新一条消息的updatedAt
      const maxUpdatedAt = _.maxBy(messages, "updatedAt")?.updatedAt;
      // 检查消息是否有变化
      const hasChanged = dayjs(maxUpdatedAt).isAfter(dayjs(updatedAt));
      if (!hasChanged) {
        // 流式消息没有变化，多延迟500ms
        await sleep(500);
      }
      // 请求未结束，继续增加触发 polling 的 reply 消息
      const { requestId, sessionId, fromUser } = messages[0];
      messages.push({
        id: new Types.ObjectId().toString(),
        type: "command",
        fromUser,
        command: Intents.pollingStreamMsg,
        reply: {
          type: "command",
          command: Intents.pollingStreamMsg,
          params: { requestId, sessionId, updatedAt: dayjs(maxUpdatedAt).valueOf() },
        },
        sessionId
      } as ICopilotMessage)
      // 长时间不结束，推送企微
      const minCreatedAt = _.minBy(messages, "createdAt")?.createdAt;
      const isTimeout = dayjs(minCreatedAt).add(60, "second").isBefore(dayjs());
      const isPushTimeout = dayjs(minCreatedAt).add(65, "second").isBefore(dayjs());
      const isBackground = messages.every((msg) => msg.background);
      if (!isBackground && isTimeout && !isPushTimeout) {
        sendPollingErrorToWechat(requestId, messages);
      }
      return messages;
    }
  }

  // 组装message消息，添加agentId owner参数
  exactFromMessage(payload: IPayload) {
    payload.app = payload.app || AppId.Question_Answer;
    const { data: fromMessage, app, companyId } = payload;
    const userId = fromMessage.fromUser;
    const agentId =
      fromMessage.nlu?.agentId ||
      fromMessage.nlu?.agentName ||
      fromMessage.agent ||
      payload.agentId ||
      payload.agentName;

    // 兼容采购助手 command 或者带 nlu 的消息缺失 agentId
    const hasNluData = Object.values(fromMessage.nlu || {}).filter(Boolean).length;
    if (app === AppId.Question_Answer && (fromMessage.type === 'command' || hasNluData)) {
      // command消息或者是nlu消息
      const nlu = fromMessage?.nlu || {};
      fromMessage.nlu = {
        ...nlu,
        agentName: agentId || AgentId.questionAnswerAgent,
        agentId,
      }
    }
    if (agentId) {
      const nlu = fromMessage.nlu || {};
      fromMessage.nlu = {
        ...nlu,
        agentName: agentId,
        agentId
      }
      fromMessage.agent = agentId;
    }

    fromMessage.app = app;

    // 组装owner
    if (app && userId && companyId) {
      fromMessage.owner = `${app}:${userId}:${companyId}`;
    }
    return fromMessage;
  }

  onPayload(callback: PayloadCallback): void {
    this.payloadCallback = callback;
  }
}

export default CopilotServer;