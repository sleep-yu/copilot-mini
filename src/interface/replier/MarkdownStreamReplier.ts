import { IMarkdownMessage, IMessage } from "../messages";
import { MessageFactory } from "../messages/factory";
import { ReplyStream, StreamReplier } from "./StreamReplier";

export class MarkdownStreamReplier extends StreamReplier {
  protected buildMessage(content: string, partials?: Partial<IMarkdownMessage>): IMessage {
    return MessageFactory.markdown(content, partials);
  }

  async reply(data: ReplyStream, partials?: Partial<IMessage>): Promise<IMarkdownMessage> {
    return super.reply(data, partials) as Promise<IMarkdownMessage>;
  }
}
