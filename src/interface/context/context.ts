import { Entity } from "../entity";
import { InnerForm, IFormConfig } from "../form";
import { SlotRecords } from "../slots";
import { Memory } from "../memory";
import { Session } from "../session";
import { IdCreator, IServiceContext, Service } from "../abstract";
import type { IPayload, ISocket, ReplyMode } from "../network";
import type { History } from "../storage";
import { MessageBuilder, type IMarkdownMessage, type IMessage, type INLU, type ITextMessage } from "../messages";
import type { Agent } from "../agent/Agent";
import type { IClassifierConfig } from "../agent/Classifier";
import type { Code, IClassifier } from "../classifier/Classifier";
import { ReplyStream } from "../replier/StreamReplier";
import { Task } from "../Task";
import type { Application } from "../app";
export interface ContextConfig extends IdCreator {
  session: Session;
  socket: ISocket;
  payload: IPayload;
  application: Application;
}
export interface SlotChanged {
  changed: boolean;
  before: any;
  after: any;
}
export type AgentHistory = {
  /**
   * @deprecated 请使用 agentId 替代
   */
  agentName: string;
  agentId: string;
  activatedAt: number;
};
export declare enum ContextState {
  INIT = 0,
  ACTIVATED = 2,
  FINISHED = 9
}
export declare class Context {
  private socket;
  private get router();
  payload: IPayload;
  readonly background: boolean;
  session: Session;
  historyMessages: IMessage[];
  private _histories;
  private agentMemories;
  agentHistories: AgentHistory[];
  /**
   * 上一条消息最后激活的Agent
   */
  prevMessageAgent?: string;
  agent: Agent | null;
  missMatchedAgents: Set<string>;
  broken: boolean;
  private state;
  /**
   * 是否自动填充槽位
   */
  autoFillSlots: boolean;
  /**
   * 设置是否自动填充槽位
   * @param autoFill 是否自动填充槽位
   */
  setAutoFillSlots(autoFill: boolean): void;
  setState(state: ContextState): void;
  /**
   * 设置回复消息ID，允许跨Agent共享
   * @param messageId
   */
  setReplyMessageId(messageId: string): void;
  /**
   * 获取回复消息ID，如果不存在则创建一个
   * @returns
   */
  getReplyMessageId(defaultMsgId?: string): string;
  get sessionId(): string;
  get lastMessage(): IMessage;
  private MESSAGE_BUILDER_KEY;
  /**
   * 返回默认的消息构建器
   */
  get messageBuilder(): MessageBuilder;
  /**
   * @deprecated 使用 context.appId 替代
   */
  get app(): string;
  get appId(): string;
  get isSessionChanged(): boolean;
  /**
   * 获取当前激活的agent的memory
   */
  get memory(): Memory;
  get slotsChanges(): Record<string, SlotChanged>;
  /**
   * @deprecated 请使用 getForm()?.name 替代
   * 当前激活的表单名称
   */
  get formName(): string | undefined;
  get histories(): History[];
  get intent(): string | symbol;
  get entities(): Entity[];
  get slots(): SlotRecords;
  get userId(): string | undefined;
  /**
   * @deprecated 请使用 agentId 替代
   */
  get agentName(): string | undefined;
  get agentId(): string | undefined;
  /**
   * @deprecated
   * 请使用 context.getForm().getValues() 替代
   */
  get formData(): {
    [x: string]: any;
  } | null;
  private _prevRepliedMessage;
  /**
   * 上一次调用reply发送的消息
   */
  get prevRepliedMessage(): Readonly<IMessage> | null;
  /**
   * 获取当前应用实例
   */
  readonly application: Application;
  createId: () => string;
  constructor(config: ContextConfig);
  private mergeMessageNlu;
  takePreClassifierConfig(): IClassifierConfig | undefined;
  private temp;
  /**
   * 设置临时变量，允许跨Agent共享，生命周期随context
   * @param key
   * @param value
   */
  setTempData<T>(key: string | symbol, value: T): void;
  /**
   * 获取临时变量
   */
  getTempData<T>(key: string | symbol): T | undefined;
  /**
   * 获取或设置临时变量
   * @param key
   * @param value
   * @returns
   */
  getOrSetTempData<T>(key: string | symbol, value: T): T;
  /**
   * 获取服务实例
   * @param ctor
   * @returns
   */
  getService<T extends Service>(ctor: new (context: IServiceContext) => T): T;
  /**
   * 激活临时分类器
   * @param classifier
   * @param categories
   */
  activatePreClassifierOnce(classifier: IClassifier, params?: {
    categories?: Code[];
    [key: string]: unknown;
  }): void;
  /**
   * 获取特定 Agent的存储
   * @param agentId
   * @returns
   */
  getAgentMemory(agentId: string): {
    agentName: string | undefined;
    agentId: string | undefined;
    intent: string | symbol | undefined;
    formName: string | undefined;
    entities: Entity[] | undefined;
    slots: SlotRecords;
    extra: Record<string, any>;
    preClassifierConfig: IClassifierConfig | undefined;
  };
  getForm<T extends IFormConfig>(name: string): InnerForm<T extends IFormConfig<infer U, any> ? U : never, T extends IFormConfig<any, infer U_1> ? U_1 : never>;
  /**
   * 清理槽位，如果不指定keys，清空所有槽位
   * @param keys
   */
  clearSlots(keys?: string[]): void;
  mergeSlots(slotsRecord: SlotRecords): void;
  /**
   * 将当前Agent的slots回退到加载时的值
   */
  rollbackSlots(): void;
  /**
   * 激活特定Agent，切换agent时，重置nlu为最近一条消息
   */
  activateAgent(agent: Agent | string | null, withIntent?: string | symbol): Promise<void>;
  /**
   * 路由次数
   */
  routeTimes: number;
  /**
   * 创建一个任务
   * 任务会被存储在临时数据中，生命周期随Context
   * @param params
   * @returns
   */
  createTask<T>(params: T): Task<T>;
  /**
   * 获取任务
   * @param taskId 任务id
   * @returns
   */
  getTask<T>(taskId: string): Task<T> | undefined;
  processTask<T>(agent: Agent | string, task: Task<T>): Promise<void>;
  /**
   * 执行Agent
   * @param agent
   * @param withIntent 路由时指定intent
   */
  routeTo(agent: Agent | string, data?: INLU | Task<unknown>): Promise<void>;
  /**
   * 重新路由
   */
  reRoute(): Promise<void | undefined>;
  /**
   * @deprecated
   * 激活表单
   */
  activateForm(formName: string): void;
  /**
   * 设置intent,并执行下一个handler
   * @param intent
   * @returns
   */
  next(intent: string | symbol): Promise<void | undefined>;
  nextCommand(command: string): Promise<void | undefined>;
  /**
   * 重置会话
   * @param saveCurrent 重置之前，是否保存当前会话
   */
  recreateSession(saveCurrent?: boolean): Promise<void>;
  load(): Promise<void>;
  private getMemoriesObject;
  save(): Promise<void>;
  /**
   * 回复消息
   * @param message
   * @param partials 消息的其他字段
   */
  reply<T extends IMessage>(message: T, partials?: Partial<T>): void;
  /**
   * 回复流式消息，返回最后一条消息数据结构
   * @param stream
   * @param partials
   * @returns
   */
  replyStream<T extends Partial<ITextMessage | IMarkdownMessage> = Partial<IMarkdownMessage>>(stream: ReplyStream, partials?: T): Promise<T extends {
    type: "text";
  } ? ITextMessage : IMarkdownMessage>;
  setReplyMode(replyMode: ReplyMode): void;
  done(): void;
  break(): void;
  setIntent(intent: string | symbol): void;
  setEntities(entities: Entity[]): void;
  setHistories(histories: History[]): void;
}
