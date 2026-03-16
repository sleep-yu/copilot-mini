import { IMessage } from "@/interface/messages";
import { CopilotMessageDoc } from "@/model/CopilotMessage";
import { FastifyReply } from "fastify";
import _ from "lodash";

export interface TransportOptions {
  reply: FastifyReply;
  fromMessage: CopilotMessageDoc;
  sessionId: string;
  requestId: string;
  waitSentMessages?: CopilotMessageDoc[];
}


export abstract class AbstractTransport {
  reply: FastifyReply;
  fromMessage: CopilotMessageDoc;
  sessionId: string;
  requestId: string;
  waitSentMessages: CopilotMessageDoc[];

  abstract name: string;

  constructor(options: TransportOptions) {
    this.reply = options.reply;
    this.fromMessage = options.fromMessage;
    this.sessionId = options.sessionId;
    this.requestId = options.requestId;
    this.waitSentMessages = options.waitSentMessages || [];
  }

  getSessionId(messages: IMessage[]) {
    return _.last(messages)?.sessionId || this.sessionId;
  }

  createPayload(messages: CopilotMessageDoc[]) {
    return {
      msgId: this.fromMessage._id,
      createdAt: this.fromMessage.createdAt,
      sessionId: this.getSessionId(messages),
      messages,
    };
  }

  abstract send(messages: IMessage[]): void;

  abstract close(): void;
}
