import { IMessage } from "../messages";
import { Replier } from "./Replier";

export type IterableReadableStreamInterface<T> = ReadableStream<T> & AsyncIterable<T>;

export type StreamChunk = string | { content: string } | { text: string };

export type ReplyStream = IterableReadableStreamInterface<StreamChunk>;

export abstract class StreamReplier extends Replier {
  protected abstract buildMessage(content: string, partials?: Partial<IMessage>): IMessage;

  private replyTokens(tokens: string[], partials?: Partial<IMessage>): IMessage {
    const message = this.buildMessage(tokens.join(""), partials);
    this.context.reply(message);
    return message;
  }

  async reply<T extends ReplyStream = ReplyStream>(stream: T, partials?: Partial<IMessage>): Promise<IMessage> {
    let tokens: string[] = [];
    let message: IMessage | undefined;
    for await (const chunk of stream) {
      if (typeof chunk === "string") {
        tokens.push(chunk);
      } else if ("text" in chunk) {
        tokens.push(chunk.text);
      } else if ("content" in chunk) {
        tokens.push(chunk.content);
      }
      message = this.replyTokens(tokens, partials);
    }

    // 如果流是空的，则发送一个空消息，确保能够返回一个消息
    if (!message) {
      message = this.replyTokens(tokens, partials);
    }
    const hasAnswer = tokens.join("")?.trim().length;
    if (!hasAnswer) {
      const fallbackAnswer = "抱歉，我无法回答你的问题。";
      message = this.replyTokens([fallbackAnswer], partials);
    }

    return message;
  }
}
