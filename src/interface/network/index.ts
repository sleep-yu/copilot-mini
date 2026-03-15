import type { IMessage } from "../messages";
import type { Session } from "../session";
export interface IPayload {
  sessionId?: string;
  app: string;
  data: IMessage;
  [extra: string]: any;
}
export type ReplyMode = 'stream' | 'block';
export interface ISocket {
  id: string;
  send(message: IMessage): void;
  end(): void;
  setReplyMode(replyMode: ReplyMode): void;
}
export interface IServer {
  onPayload(callback: (payload: IPayload, socket: ISocket, session: Session) => Promise<void>): void;
}
