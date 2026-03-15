import { Entity } from "../entity";
import { IMessage } from "../messages";
import { IPayload } from "../network";
import { SlotRecords } from "../slots";
export interface IServiceContext {
  payload: IPayload;
  sessionId: string;
  lastMessage: IMessage;
  historyMessages: IMessage[];
  app: string;
  userId?: string;
  intent: string | symbol;
  slots: SlotRecords;
  entities: Entity[];
  setTempData<T>(key: string, value: T): void;
  getTempData<T>(key: string): T | undefined;
  getOrSetTempData<T>(key: string, value: T): T;
  getReplyMessageId(defaultMsgId?: string): string;
  setReplyMessageId(msgId: string): void;
}
export declare abstract class Service {
  protected context: IServiceContext;
  constructor(context: IServiceContext);
}
