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
import { sendMessageToWechat } from "@/common/utils/wechat";
import { useRequestMeta } from "@/common/asyncStore";
import { ReplyMode } from "@/interface/network";
import { IMessage, ISocket } from "@/interface/messages";

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
      }
    }
  }
}