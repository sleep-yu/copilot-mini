import { IdCreator } from "../abstract";
import { IMemoryOptions } from "../memory";
import { IContextData, IStorage } from "../storage";
interface SessionOptions extends IdCreator {
  app: string;
  userId: string;
  storage: IStorage;
  sessionId?: string;
  dialogueId?: string;
}
export declare class Session {
  protected options: SessionOptions;
  sessionId: string;
  storage: IStorage;
  userId: string;
  app: string;
  dialogueId: string;
  protected static expiresInMap: Map<string, number>;
  private contextData?;
  private initializedSessionId;
  get isSessionIdChanged(): boolean;
  createId: () => string;
  constructor(options: SessionOptions);
  /**
   * 设置对应App的过期时间
   * @param app
   * @param expiresIn
   */
  static registerExpiresIn(app: string, expiresIn: number): void;
  /**
   * 从AgentMemories中裁剪所需字段
   * @param agentMemories
   * @returns
   */
  private clipAgentMemories;
  private createContextData;
  private getOrCreateContextData;
  /**
   * 检查是否过期
   * @param item
   * @returns
   */
  private isExpired;
  /**
   * 根据sessionId加载上下文
   * @param sessionId
   */
  loadContextData(): Promise<IContextData>;
  saveContextData(contextData: IContextData): Promise<void>;
  /**
   * 创建新的session对象
   */
  renew(memories?: Record<string, IMemoryOptions>): Promise<Session>;
}
export { };
