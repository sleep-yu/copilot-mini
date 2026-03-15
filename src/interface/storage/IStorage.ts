import { IMemoryOptions } from "../memory/Memory";
import { IMessage } from "../messages";
export interface History {
  agent?: string;
  intent: string;
  formName?: string;
}
export interface IContextData {
  agentMemories: Record<string, IMemoryOptions>;
  sessionId: string;
  userId: string;
  app?: string;
  /**
   * @deprecated use `agentId` instead
   */
  agentName?: string;
  agentId?: string;
  dialogueId?: string;
  histories: History[];
  historyMessages?: IMessage[];
  updatedAt?: number;
  [key: string]: any;
}
export interface IStorage {
  getItemAsync(sessionId: string): Promise<IContextData>;
  setItemAsync(sessionId: string, data: IContextData): Promise<void>;
}
