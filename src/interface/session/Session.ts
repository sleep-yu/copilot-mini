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
export class Session {
  sessionId: string;
  storage: IStorage;
  userId: string;
  app: string;
  dialogueId: string;

  protected static expiresInMap = new Map<string, number>();

  private contextData?: IContextData;

  private initializedSessionId: string;

  public get isSessionIdChanged() {
    return this.initializedSessionId !== this.sessionId;
  }

  createId: () => string;

  constructor(protected options: SessionOptions) {
    // this.contextData = options.contextData;
    this.sessionId = options.sessionId || "";
    this.initializedSessionId = this.sessionId;
    this.storage = options.storage;
    this.userId = options.userId;
    this.app = options.app;
    this.dialogueId = options.dialogueId || "";
    this.createId = options.createId;
  }

  /**
   * 设置对应App的过期时间
   * @param app
   * @param expiresIn
   */
  static registerExpiresIn(app: string, expiresIn: number) {
    this.expiresInMap.set(app, expiresIn);
  }
  /**
   * 从AgentMemories中裁剪所需字段
   * @param agentMemories
   * @returns
   */
  private clipAgentMemories(agentMemories: Record<string, IMemoryOptions>) {
    const nextAgentMemories: Record<string, IMemoryOptions> = {};
    // 从每个AgentMemory中根据 slotsConfig 裁剪 slots
    for (const agentId of Object.keys(agentMemories)) {
      const memo = agentMemories[agentId];
      const slotsConfig = memo.slotsConfig || {};
      const slots = memo.slots || {};
      const nextSlots: Record<string, IMemoryOptions["slots"]> = {};
      for (let slotKey of Object.keys(slotsConfig)) {
        const slotConfig = slotsConfig[slotKey] || {};
        if (slotConfig.lifetime === "forever") {
          nextSlots[slotKey] = slots[slotKey];
        }
      }
      nextAgentMemories[agentId] = { slotsConfig, slots: nextSlots };
    }
    return nextAgentMemories;
  }
  private async createContextData() {
    const item = {
      agentMemories: {},
      sessionId: this.createId(),
      userId: this.userId,
      app: this.app,
      dialogueId: this.dialogueId,
      histories: [],
      historyMessages: [],
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };
    return item;
  }

  private async getOrCreateContextData(): Promise<IContextData> {
    // 没有传contextData
    if (!this.sessionId) {
      return this.createContextData();
    }

    let contextData = await this.storage.getItemAsync(this.sessionId);
    if (!contextData?.sessionId) {
      return this.createContextData();
    }

    // 防止使用其他人session访问
    if (contextData.userId !== this.userId || contextData.app !== this.app) {
      throw new Error("session: userId or app not match");
    }

    return contextData;
  }

  /**
   * 检查是否过期
   * @param item
   * @returns
   */
  private isExpired(item: IContextData) {
    if (item.updatedAt && item.app) {
      const expiresIn = Session.expiresInMap.get(item.app) || 0;
      if (expiresIn <= 0) {
        return false;
      }
      return Date.now() - new Date(item.updatedAt).getTime() > expiresIn;
    }
    return false;
  }
  /**
   * 根据sessionId加载上下文
   * @param sessionId
   */
  async loadContextData() {
    if (this.contextData) {
      return this.contextData;
    }

    let item = await this.getOrCreateContextData();

    /**
     * 如果Context过期，则重新生成
     */
    if (this.isExpired(item)) {
      const beforeAgentMemories = item.agentMemories || {};
      item = await this.createContextData();
      item.agentMemories = this.clipAgentMemories(beforeAgentMemories);
    }

    // 兼容历史代码
    item.sessionChanged = item.sessionId !== this.sessionId;
    // await this.saveContextData(item);
    this.sessionId = item.sessionId || this.sessionId;
    this.contextData = item;
    return item;
  }
  async saveContextData(contextData: IContextData) {
    this.sessionId = contextData.sessionId || this.sessionId;
    this.contextData = contextData;
    await this.storage.setItemAsync(this.sessionId!, {
      app: this.app,
      ...contextData,
      historyMessages: [],
    });
  }

  /**
   * 创建新的session对象
   */
  async renew(memories: Record<string, IMemoryOptions> = {}) {
    const session = new Session({ ...this, sessionId: undefined });
    const contextData = await session.createContextData();
    contextData.agentMemories = session.clipAgentMemories(memories);
    (contextData as IContextData).sessionChanged = true;
    session.sessionId = contextData.sessionId;
    session.contextData = contextData;
    return session;
  }
}
export { };
