import { AbstractTransport, TransportOptions } from "./AbstractTransport";
import { CopilotMessageDoc } from "@/model/CopilotMessage";
import { EventStreamContentType } from "@/common/infra/fetch";

export class EventSourceTransport extends AbstractTransport {
  name = "event-source";

  private controller?: ReadableStreamDefaultController;

  constructor(options: TransportOptions) {
    super(options);
    this.reply.header("Content-Type", EventStreamContentType);
    const readableStream = new ReadableStream({
      start: (controller) => {
        this.controller = controller;
      },
    });
    this.reply.send(readableStream);
  }

  send(messages: CopilotMessageDoc[]): void {
    let all = messages;
    if (this.waitSentMessages.length) {
      all = [...this.waitSentMessages, ...messages];
      this.waitSentMessages = [];
    }
    this.controller?.enqueue("data: " + JSON.stringify(this.createPayload(all)) + "\n\n");
  }

  close(): void {
    this.controller?.close();
  }
}
