import { IMessage } from "../messages";
import { Replier } from "./Replier";
export type IterableReadableStreamInterface<T> = ReadableStream<T> & AsyncIterable<T>;
export declare class IterableReadableStream<T> extends ReadableStream<T> {
  next(): Promise<IteratorResult<T>>;
  return(): Promise<IteratorResult<T>>;
  throw(e: any): Promise<IteratorResult<T>>;
  [Symbol.asyncIterator](options?: ReadableStreamIteratorOptions): ReadableStreamAsyncIterator<T>;
}
export type StreamChunk = string | {
  content: string;
} | {
  text: string;
};
export type ReplyStream = IterableReadableStream<StreamChunk>;
export declare abstract class StreamReplier extends Replier {
  protected abstract buildMessage(content: string, partials?: Partial<IMessage>): IMessage;
  private replyTokens;
  reply<T extends ReplyStream = ReplyStream>(stream: T, partials?: Partial<IMessage>): Promise<IMessage>;
}
