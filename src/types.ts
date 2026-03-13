// ===========================
// 核心类型定义
// 对应原项目 @casstime/copilot-core 中暴露的接口
// ===========================

// 消息类型
export type MessageType = "text" | "image" | "voice" | "command" | "markdown";

export interface IMessage {
  id?: string;
  type: MessageType;
  content: string;
  fromUser: string;    // "user" | "system"
  sessionId?: string;
  requestId?: string;
  createdAt?: number;
}

// Context 是每轮对话的上下文，原项目由 @casstime/copilot-core 提供
export interface IContext {
  sessionId: string;
  appName: string;
  lastMessage: IMessage;
  historyMessages: IMessage[];
  slots: Record<string, unknown>;

  /** 设置当前意图 */
  setIntent(intent: string): void;
  /** 获取当前意图 */
  getIntent(): string;
  /** 向用户回复消息 */
  reply(message: IMessage): void;
  /** 切换到另一个 Agent */
  activateAgent(agentId: string | null): Promise<void>;
}

// Storage 接口，对应原项目 IStorage
export interface IContextData {
  sessionId: string;
  appName: string;
  historyMessages: IMessage[];
  slots: Record<string, unknown>;
}

export interface IStorage {
  getItemAsync(sessionId: string): Promise<IContextData>;
  setItemAsync(sessionId: string, data: IContextData): Promise<void>;
}

// Classifier：决定消息进哪个 Agent
export interface IClassifier {
  id: string;
  classify(context: IContext): Promise<string>;
}

// Agent 处理器
export type HandlerFn = (context: IContext) => Promise<void>;

// IntentParser：分析用户意图
export type IntentParserFn = (context: IContext) => Promise<void>;
