import { AbstractTransport } from "./AbstractTransport";
import { RequestStatus } from "@/model/RequestStatus";
import { Types } from "mongoose";
import { Intents } from "@/copilot/constants/Intents";
import { CopilotMessageDoc } from "@/model/CopilotMessage";
import logger from "@/common/logger/logger";
import _ from "lodash";
import dayjs from "dayjs";

export class PollingTransport extends AbstractTransport {
  name = "polling";

  private isSent = false;

  async send(messages: CopilotMessageDoc[]) {
    if (this.isSent) {
      return;
    }
    const msgs = [...this.waitSentMessages, ...messages];
    this.waitSentMessages = [];
    if (msgs.length) {
      this.isSent = true;
      await RequestStatus.create({
        requestId: this.requestId,
        done: false,
      }).catch(e => {
        logger.error("create request status error", e)
      })
      const sessionId = this.getSessionId(msgs);
      // 取出最新一条消息的 updatedAt
      const maxUpdatedAt = _.maxBy(messages, "updatedAt")?.updatedAt;
      // 增加触发 polling 的 reply 消息
      msgs.push({
        id: new Types.ObjectId().toString(),
        type: "command",
        fromUser: msgs[0].fromUser,
        command: Intents.pollingStreamMsg,
        reply: {
          type: "command",
          command: Intents.pollingStreamMsg,
          params: { requestId: this.requestId, sessionId, updatedAt: dayjs(maxUpdatedAt).valueOf() },
        },
        sessionId,
      } as CopilotMessageDoc);
      this.reply.send(this.createPayload(msgs));
    }
  }

  close(): void {
    RequestStatus.updateOne({ requestId: this.requestId }, { $set: { done: true } }).catch((err) => {
      logger.error("update request status error", err);
    });
    if (!this.isSent) {
      this.reply.send(this.createPayload(this.waitSentMessages));
    }
  }
}