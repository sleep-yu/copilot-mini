// ===========================
// Copilot 类
// 对应原项目 @casstime/copilot-core 的 Copilot
//
// 原项目用法：
//   const copilot = new Copilot({ storage, createId });
//   copilot.registerApplication(garageAssistantApp);
//   copilot.onContextInitialized(async (context) => { ... });
//   copilot.attach(copilotServer);
// ===========================

import { Application } from "./Application";
import { IContext, IStorage, IContextData, IMessage } from "../types";
import logger from "../common/logger";
import { randomUUID } from "crypto";

interface CopilotOptions {
  storage: IStorage;
  createId?: () => string;
}

type ContextInitializedFn = (context: IContext) => Promise<void>;

// 运行时 Context 实现（原项目由 copilot-core 内部实现）
class RuntimeContext implements IContext {
  sessionId: string;
  appName: string;
  lastMessage: IMessage;
  historyMessages: IMessage[];
  slots: Record<string, unknown>;

  private _intent = "";
  private _replies: IMessage[] = [];
  private _nextAgentId: string | null = null;

  constructor(data: IContextData, lastMessage: IMessage) {
    this.sessionId = data.sessionId;
    this.appName = data.appName;
    this.historyMessages = data.historyMessages;
    this.slots = data.slots ?? {};
    this.lastMessage = lastMessage;
  }

  setIntent(intent: string) {
    this._intent = intent;
  }

  getIntent(): string {
    return this._intent;
  }

  reply(message: IMessage) {
    this._replies.push(message);
  }

  async activateAgent(agentId: string | null) {
    this._nextAgentId = agentId;
  }

  getReplies(): IMessage[] {
    return this._replies;
  }

  toContextData(): IContextData {
    return {
      sessionId: this.sessionId,
      appName: this.appName,
      historyMessages: [
        ...this.historyMessages,
        this.lastMessage,
        ...this._replies,
      ],
      slots: this.slots,
    };
  }
}

export class Copilot {
  private storage: IStorage;
  private createId: () => string;
  private applications: Map<string, Application> = new Map();
  private contextInitializedHook?: ContextInitializedFn;

  constructor(options: CopilotOptions) {
    this.storage = options.storage;
    this.createId = options.createId ?? (() => randomUUID());
  }

  /** 注册应用，对应原项目 copilot.registerApplication(...) */
  registerApplication(app: Application) {
    this.applications.set(app.appId, app);
    logger.info(`[Copilot] 注册应用: ${app.appId} (${app.name})`);
  }

  /** Context 初始化完毕后的回调，原项目用于设置 replyMsgId、处理图片等 */
  onContextInitialized(fn: ContextInitializedFn) {
    this.contextInitializedHook = fn;
  }

  /**
   * 处理一条用户消息，入口
   * @param sessionId  会话 ID
   * @param appId      应用 ID
   * @param message    用户消息
   * @returns 本轮系统回复列表
   */
  async handleMessage(
    sessionId: string,
    appId: string,
    message: IMessage
  ): Promise<IMessage[]> {
    // 1. 从 storage 加载会话上下文
    const contextData = await this.storage.getItemAsync(sessionId);
    contextData.appName = appId;

    // 2. 构建 RuntimeContext
    const context = new RuntimeContext(contextData, message);

    // 3. 执行 onContextInitialized 钩子
    if (this.contextInitializedHook) {
      await this.contextInitializedHook(context);
    }

    // 4. 找到对应 Application
    const app = this.applications.get(appId);
    if (!app) {
      logger.warn(`[Copilot] 找不到应用: ${appId}`);
      return [{ type: "text", content: `未知应用: ${appId}`, fromUser: "system" }];
    }

    // 5. 应用处理消息
    await app.handle(context);

    // 6. 持久化更新后的 context
    await this.storage.setItemAsync(sessionId, context.toContextData());

    // 7. 返回本轮回复
    return context.getReplies();
  }
}

// ===========================
// Copilot 实例（单例）
// ===========================
import { storage } from "../storage";
import { garageAssistantApp } from "./apps";

const copilot = new Copilot({ storage });

copilot.registerApplication(garageAssistantApp);

copilot.onContextInitialized(async (context) => {
  const lastMessage = context.lastMessage;
  if (lastMessage.type === "image") {
    // 原项目这里会处理 OSS 图片压缩
    // 这里省略
  }
});

export default copilot;
