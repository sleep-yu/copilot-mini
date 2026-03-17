import _ from "lodash";
import { BreakError } from "../errors";
import { Entity } from "../entity";
import { InnerForm, IFormConfig, Form } from "../form";
import { SlotRecords } from "../slots";
import { Memory } from "../memory/Memory";
import { Session } from "../session";
import { IServiceContext, Service } from "../abstract";
import type { IPayload, ISocket, ReplyMode } from "../network";
import type { History } from "../storage";
import type { IMarkdownMessage, IMessage, INLU, ITextMessage } from "../messages";
import type { Agent, Code, IClassifier } from "../agent";
import { Router } from "../Router";
import { ReplyStream } from "../replier/StreamReplier";
import { MarkdownStreamReplier, Replier, TextStreamReplier } from "../replier";
import { isClass } from "../helpers/utils";
import { Task } from "../Task";

export interface ContextConfig {
  session: Session;
  socket: ISocket;
  payload: IPayload;
  router?: Router;
}

export interface SlotChanged {
  changed: boolean;
  before: any;
  after: any;
}

export type AgentHistory = {
  agentName: string;
  activatedAt: number;
};

export enum ContextState {
  INIT = 0,
  ACTIVATED = 2,
  FINISHED = 9,
}

export class Context {
  private socket: ISocket;
  private router?: Router;

  public payload: IPayload;

  readonly background: boolean;

  session: Session;

  historyMessages: IMessage[] = [];

  private _histories: History[] = [];

  private agentMemories: Record<string, Memory> = {};

  agentHistories: AgentHistory[] = [];

  /**
   * 上一条消息最后激活的Agent
   */
  prevMessageAgent?: string;

  agent: Agent | null = null;

  missMatchedAgents: Set<string> = new Set();

  broken = false;

  // 是否持久化
  private state = ContextState.INIT;

  setState(state: ContextState) {
    this.state = state;
  }

  get sessionId() {
    return this.session.sessionId;
  }

  get lastMessage() {
    return this.payload.data;
  }

  get app() {
    return this.session.app;
  }

  /**
   * 获取当前激活的agent的memory
   */
  get memory() {
    const agentName = this.agent?.name || "<null>";
    const mem = this.agentMemories[agentName];
    if (!mem) {
      this.agentMemories[agentName] = new Memory();
    }
    return this.agentMemories[agentName];
  }

  // 变化的槽
  get slotsChanges(): Record<string, SlotChanged> {
    return this.memory.slotsChanges || {};
  }

  /**
   * @deprecated 请使用 getForm()?.name 替代
   * 当前激活的表单名称
   */
  get formName() {
    return this.memory.formName;
  }

  get histories() {
    return this._histories;
  }

  get intent(): string | symbol {
    return this.memory.intent || "";
  }

  get entities(): Entity[] {
    return this.memory.entities || [];
  }

  get slots(): SlotRecords {
    return this.memory.slots || {};
  }

  get userId() {
    return this.lastMessage.fromUser;
  }

  get agentName() {
    return this.agent?.name;
  }

  /**
   * @deprecated
   * 请使用 context.getForm().getValues() 替代
   */
  get formData() {
    if (!this.formName) {
      return null;
    }
    try {
      return this.getForm(this.formName).getValues();
    } catch (err) {
      return null;
    }
  }

  constructor(config: ContextConfig) {
    this.session = config.session;
    this.socket = config.socket;
    this.payload = config.payload;
    this.router = config.router;
    this.background = config.payload.data?.background || false;
  }

  private mergeMessageNlu() {
    if (!this.lastMessage.nlu) {
      return;
    }
    const { intent, slots, entities } = this.lastMessage.nlu;
    if (intent && typeof intent === "string") {
      this.setIntent(intent);
    }
    if (slots) {
      this.mergeSlots(slots);
    }
    if (entities) {
      this.setEntities(entities);
    }
  }

  takePreClassifierConfig() {
    return this.memory.takePreClassifierConfig();
  }

  private temp = new Map<unknown, unknown>();

  /**
   * 设置临时变量，允许跨Agent共享，生命周期随context
   * @param key
   * @param value
   */
  setTempData<T>(key: string, value: T) {
    this.temp.set(key, value);
  }

  /**
   * 获取临时变量
   */
  getTempData<T>(key: string): T | undefined {
    return this.temp.get(key) as T;
  }

  /**
   * 获取或设置临时变量
   * @param key
   * @param value
   * @returns
   */
  getOrSetTempData<T>(key: string, value: T): T {
    if (this.temp.has(key)) {
      return this.temp.get(key) as T;
    }
    this.temp.set(key, value);
    return value;
  }

  /**
   * 获取服务实例
   * @param ctor
   * @returns
   */
  getService<T extends Service>(ctor: new (context: IServiceContext) => T): T {
    // 临时变量中存在则直接返回
    if (!this.temp.get(ctor)) {
      this.temp.set(ctor, new ctor(this));
    }
    return this.temp.get(ctor) as T;
  }

  /**
   * 激活临时分类器
   * @param classifier
   * @param categories
   */
  activatePreClassifierOnce(classifier: IClassifier, params: { categories?: Code[];[key: string]: unknown } = {}) {
    this.memory.setPreClassifierConfig({ id: classifier.id, params });
  }

  /**
   * 获取特定 Agent的存储
   * @param agentName
   * @returns
   */
  getAgentMemory(agentName: string) {
    return this.agentMemories[agentName]?.toObject() || {};
  }

  getForm<T extends IFormConfig>(name: string) {
    let config = this.agent?.getFormConfig(name);
    if (!config) {
      throw new Error(`Form ${name} not found`);
    }

    if (isClass<new (context: Context) => IFormConfig>(config)) {
      if (!this.temp.get(config)) {
        this.temp.set(config, new config(this));
      }
      config = this.temp.get(config) as T;
    }

    const tempKey = `__FORM_${name}__`;
    type F = T extends IFormConfig<infer U> ? U : never;
    type R = T extends IFormConfig<any, infer U> ? U : never;
    if (!this.temp.get(tempKey)) {
      this.temp.set(tempKey, new InnerForm(config as IFormConfig<F, R>, this));
    }

    return this.temp.get(tempKey) as InnerForm<F, R>;
  }

  /**
   * 清理槽位，如果不指定keys，清空所有槽位
   * @param keys
   */
  clearSlots(keys?: string[]) {
    const allKeys = keys ? keys : Object.keys(this.slots);
    // 将所有的槽位设置成undefined
    const records = allKeys.reduce((prev, key) => {
      prev[key] = undefined;
      return prev;
    }, {} as SlotRecords);
    this.mergeSlots(records);
  }

  mergeSlots(slotsRecord: SlotRecords) {
    this.memory.setSlots({
      ...this.slots,
      ...slotsRecord,
    });
  }

  /**
   * 将当前Agent的slots回退到加载时的值
   */
  rollbackSlots() {
    this.memory.rollbackSlots();
  }

  /**
   * 激活特定Agent，切换agent时，重置nlu为最近一条消息
   */
  async activateAgent(agent: Agent | string | null, withIntent?: string) {
    const latestAgent = this.agentHistories[this.agentHistories.length - 1];
    let current: Agent | null;
    if (typeof agent === "string") {
      current = this.router?.agents[agent] || null;
    } else {
      current = agent;
    }
    if (latestAgent?.agentName !== current?.name) {
      this.agentHistories.push({
        agentName: current?.name || "<null>",
        activatedAt: Date.now(),
      });
      await this.agent?.leave(this);
    }
    this.agent = current;
    this.setState(ContextState.ACTIVATED);
    await current?.enter(this);
    this.mergeMessageNlu();
    if (withIntent) {
      this.setIntent(withIntent);
    }
  }

  /**
   * 路由次数
   */
  routeTimes = 0;

  /**
   * 创建一个任务
   * 任务会被存储在临时数据中，生命周期随Context
   * @param params
   * @returns
   */
  createTask<T>(params: T): Task<T> {
    const task = new Task<T>(params);
    this.setTempData(`__TASK__${task.id}__`, task);
    return task;
  }

  /**
   * 获取任务
   * @param taskId 任务id
   * @returns
   */
  getTask<T>(taskId: string): Task<T> | undefined {
    return this.getTempData<Task<T>>(`__TASK__${taskId}__`);
  }

  processTask<T>(agent: Agent | string, task: Task<T>) {
    return this.routeTo(agent, task);
  }

  /**
   * 执行Agent
   * @param agent
   * @param withIntent 路由时指定intent
   */
  async routeTo(agent: Agent | string, data?: INLU | Task<unknown>) {
    let toAgent: Agent | null;
    if (typeof agent === "string") {
      toAgent = this.router?.agents[agent] || null;
    } else {
      toAgent = agent;
    }
    // 防止死循环，相同agent不能连续路由
    if (toAgent !== this.agent) {
      this.routeTimes++;
      await this.activateAgent(toAgent, Task.isTask(data) ? undefined : (typeof data?.intent === 'string' ? data.intent : undefined));
      if (toAgent) {
        await toAgent.execute(this, data);
      }
    }
    this.setState(ContextState.ACTIVATED);
  }

  /**
   * 重新路由
   */
  async reRoute() {
    if (this.agent) {
      this.missMatchedAgents.add(this.agent?.name);
    }
    return this.router?.execute(this);
  }

  /**
   * @deprecated
   * 激活表单
   */
  activateForm(formName: string) {
    this.memory.formName = formName;
  }

  /**
   * 设置intent,并执行下一个handler
   * @param intent
   * @returns
   */
  async next(intent: string) {
    this.setIntent(intent);
    return this.agent?.executeHandler(this, intent);
  }

  async nextCommand(command: string) {
    return this.next(`@command/${command}`);
  }

  /**
   * 重置会话
   * @param saveCurrent 重置之前，是否保存当前会话
   */
  async recreateSession(saveCurrent = false) {
    if (saveCurrent) {
      await this.save();
    }
    const memories = this.getMemoriesObject();
    this.session = await this.session.renew(memories);
    await this.load();
  }

  // 加载会话
  async load() {
    const data = await this.session.loadContextData();
    if (data) {
      // 初始化memory
      const memories = data.agentMemories || {};
      const agentMemories = Object.keys(memories).reduce((prev, key) => {
        prev[key] = new Memory(memories[key]);
        return prev;
      }, {} as Record<string, Memory>);
      const agentHistories: AgentHistory[] = data.agentHistories || [];
      this.prevMessageAgent = agentHistories[agentHistories.length - 1]?.agentName;
      this._histories = data.histories || [];
      this.agentMemories = agentMemories;
      // 历史消息不包含当前消息
      const historyMessages = data.historyMessages?.filter((msg) => msg.id !== this.lastMessage.id);
      this.historyMessages = historyMessages || [];
      // 兼容历史代码
      this.payload.sessionChanged = data.sessionChanged;
    }
  }

  private getMemoriesObject() {
    const memories = Object.keys(this.agentMemories).reduce((prev, key) => {
      prev[key] = this.agentMemories[key].persistenceObject();
      return prev;
    }, {} as Record<string, any>);
    delete memories["<null>"];
    return memories;
  }

  // 保存会话
  async save() {
    // 未初始化或是后台，不保存
    if (this.state < ContextState.ACTIVATED || this.background) {
      return;
    }
    const memories = this.getMemoriesObject();
    await this.session.saveContextData({
      app: this.app,
      sessionId: this.session.sessionId,
      dialogueId: this.session.dialogueId,
      userId: this.lastMessage.fromUser!,
      agentMemories: memories,
      agentHistories: this.agentHistories,
      histories: this.histories,
    });
  }

  /**
   * 回复消息
   * @param message
   * @param partials 消息的其他字段
   */
  reply<T extends IMessage>(message: T, partials: Partial<T> = {}) {
    if (!this.broken) {
      let merged = { ...message, ...partials };
      merged.persistent = merged.persistent !== false;
      merged = Object.assign(merged, {
        agent: this.agentName,
        app: this.app,
        sessionId: this.sessionId,
        dialogueId: this.session.dialogueId,
        background: this.agent?.isBackground() ? true : message.background,
      });
      this.socket.send(merged);
    }
  }

  /**
   * 回复流式消息，返回最后一条消息数据结构
   * @param stream
   * @param partials
   * @returns
   */
  replyStream<T extends Partial<ITextMessage | IMarkdownMessage> = Partial<IMarkdownMessage>>(
    stream: ReplyStream,
    partials = {} as T
  ) {
    const type = partials.type || "markdown";
    const replier: Replier = type === "markdown" ? MarkdownStreamReplier.for(this) : TextStreamReplier.for(this);
    return replier.reply(stream, { ...partials, type } as T) as Promise<
      T extends { type: "text" } ? ITextMessage : IMarkdownMessage
    >;
  }

  setReplyMode(replyMode: ReplyMode) {
    this.socket.setReplyMode(replyMode);
  }

  done() {
    this.break();
  }

  break() {
    this.broken = true;
    throw new BreakError("Triggered by break()");
  }

  setIntent(intent: string) {
    this.memory.setIntent(intent);
  }

  setEntities(entities: Entity[]) {
    this.memory.setEntities(entities);
  }

  setHistories(histories: History[]) {
    // 只保持最后100条历史
    this._histories = histories.slice(-100);
  }
}
