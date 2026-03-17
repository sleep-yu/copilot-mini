import { IMessage, ITextMessage } from "../messages";
import { MessageFactory } from "../messages/factory";
import { ReplyStream, StreamReplier } from "./StreamReplier";

export class TextStreamReplier extends StreamReplier {
  protected buildMessage(content: string, partials?: Partial<ITextMessage>): IMessage {
    return MessageFactory.text(content, partials);
  }

  async reply(data: ReplyStream, partials?: Partial<IMessage>): Promise<ITextMessage> {
    return super.reply(data, partials) as Promise<ITextMessage>;
  }
}
