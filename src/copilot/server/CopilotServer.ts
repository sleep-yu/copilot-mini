import { FastifyInstance } from "fastify";
import { IServer } from "@/interface/network";
import { useRequestMeta } from "@/common/asyncStore";
import { ICommandMessage, IPayload, IMessage } from "@/interface/messages";
import { AppId } from "@/common/enums/AppId";
import { AgentId, VersionEnum } from "@/common/enums";
import { parseUserAgent } from "@/common/utils";
import { Version } from "@/common/utils";
import { ISocket } from "@/interface/IServer";
import { Dialogue } from "@/model/Dialogue";
import { AppMap } from "@/common/enums/AppId";
import { Intents } from "../constants/Intents";
import { sleep } from "@/common/utils";
import { RequestStatus } from "@/model/RequestStatus";
import { CopilotMessage } from "@/model/CopilotMessage";

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
        }
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

}

export default CopilotServer;