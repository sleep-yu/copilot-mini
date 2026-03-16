import { AbstractTransport } from "./AbstractTransport";
import { CopilotMessageDoc } from "@/models";

export class BlockTransport extends AbstractTransport {
  name = "block";

  send(messages: CopilotMessageDoc[]): void {
    for (const message of messages) {
      if (message.id) {
        this.waitSentMessages = this.waitSentMessages.filter((m) => m.id !== message.id);
      }
      this.waitSentMessages.push(message);
    }
  }

  close(): void {
    this.reply.send(this.createPayload(this.waitSentMessages));
    this.waitSentMessages = [];
  }
}
