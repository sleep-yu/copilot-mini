import { FastifyReply } from "fastify";
import { CopilotMessage, CopilotMessageDoc } from "@/model/CopilotMessage";
import { Types } from "mongoose";
import logger from "@/common/logger/logger";
import MessageQueue from "./MessageQueue";
import { AbstractTransport, TransportOptions } from "./transports/AbstractTransport";
import { PollingTransport } from "./transports/PollingTransport";
import { EventSourceTransport } from "./transports/EventSourceTransport";
import { BlockTransport } from "./transports/BlockTransport";
import MessageProcessor from "./MessageProcessor";
import { useRequestMeta } from "@/common/asyncStore";
import { ReplyMode } from "@/interface/network";
import { IMessage, ISocket } from "@/interface/messages";
import { sendMessageErrorToWechat } from "@/common/utils/wechat";

interface ISocketOptions {
  sessionId: string;
  fromMessage: CopilotMessageDoc;
  reply: FastifyReply;
  replyMode: ReplyMode;
  requestId: string;
  messageProcessor: MessageProcessor;
}

class CopilotSocket implements ISocket {
  id: string;
  private fromMessage: CopilotMessageDoc;
  private reply: FastifyReply;
  private transport!: AbstractTransport;
  private requestId: string;
  private messageQueue: MessageQueue<unknown>;
  private messageProcessor: MessageProcessor;

  constructor(options: ISocketOptions) {
    this.id = options.sessionId;
    this.fromMessage = options.fromMessage;
    this.reply = options.reply;
    this.requestId = options.requestId;
    this.messageProcessor = options.messageProcessor;
    const transportName = options.replyMode === "stream" ? "event-source" : undefined;
    this.setTransport(transportName || "block");
    this.messageQueue = new MessageQueue(this.consumer);
  }

  /**
   * polling - 轮询，分批返回，短链接
   * block - 短链接，一次性返回全部，普通请求
   * event-source - 长链接 实时流式推送 AI流式响应
   * @param transport 
   */
  private setTransport(transport: "polling" | "event-source" | "block") {
    const options: TransportOptions = {
      reply: this.reply,
      waitSentMessages: this.transport?.waitSentMessages,
      fromMessage: this.fromMessage,
      sessionId: this.id,
      requestId: this.requestId
    }

    switch (transport) {
      case "polling":
        this.transport = new PollingTransport(options);
        break;
      case "event-source":
        this.transport = new EventSourceTransport(options);
        break;
      case "block":
        this.transport = new BlockTransport(options);
        break;
      default:
        throw new Error('Unknown transport')
    }
  }

  // 消费消息队列，保存到数据库并通过transport发送消息
  private consumer = async (message: IMessage) => {
    // 处理兼容问题
    const messages = this.messageProcessor.process(message);
    const msgs = [];
    let firstMsg = undefined;
    for (const msg of messages) {
      let waitSentMsg = msg;
      if (msg.persistent !== false) {
        const isBackground = msg.background === true;
        if (isBackground && msg.type !== 'command') {
          const savedMsg = await CopilotMessage.findById(msg.id ? new Types.ObjectId(msg.id) : new Types.ObjectId());
          if (savedMsg) {
            waitSentMsg.sessionId = savedMsg.sessionId;
          }
        }
        waitSentMsg = await CopilotMessage.findOneAndUpdate(
          { _id: msg.id ? new Types.ObjectId(msg.id) : new Types.ObjectId() },
          Object.assign(
            { sessionId: this.id, embed: undefined, indicator: undefined, tips: undefined, actions: [] },
            msg,
            {
              id: undefined,
              toUser: this.fromMessage.fromUser,
              fromUser: "system",
              owner: this.fromMessage.owner,
              requestId: this.requestId,
            }
          ),
          { upsert: true, new: true }
        )
      }
      if (!firstMsg && waitSentMsg.type !== 'command') {
        firstMsg = waitSentMsg;
      }
      msgs.push(waitSentMsg);
      if (waitSentMsg.extra && waitSentMsg.extra.code && waitSentMsg.extra.message && waitSentMsg.extra.stack) {
        sendMessageErrorToWechat(waitSentMsg);
      } else if (waitSentMsg.type === "text" && waitSentMsg.content) {
        const errorPattern = /(失败|错误|异常|出错|系统繁忙|参数格式校验失败|需求不能为空)/;
        if (errorPattern.test(waitSentMsg.content)) {
          sendMessageErrorToWechat(waitSentMsg);
        }
      }
    }

    const { messageReporter } = useRequestMeta();
    messageReporter.modifyMessages({ messageId: firstMsg?.id || "" });
    this.transport.send(msgs);
  }

  // 把消息放到消息队列供消费
  send(message: CopilotMessageDoc) {
    this.messageQueue.push(message);
  }

  async end() {
    // 等待队列清空
    try {
      await this.messageQueue.waitQueueEmpty();
      this.transport.close();
    } catch (error) {
      logger.error(`队列清空异常`, error);
    }
  }

  // 设置输出模式，暂时只支持从block切换到stream
  setReplyMode(replyMode: ReplyMode) {
    if (this.transport.name === 'block' && replyMode === 'stream') {
      this.setTransport('polling');
      return;
    }
    logger.warn("replyMode 只允许从 block 切换到 stream")
  }
}

export default CopilotSocket;