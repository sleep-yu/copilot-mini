import type { Context } from "../context";
import type { FormConfig } from "../form";
import { SlotConfig as SlotConfig, SlotRecords } from "../slots";
import type { INLU } from "../messages";
import { FALLBACK_SYMBOL, IClassifier } from "../classifier/Classifier";
import { buildCommandIntent } from "../helpers/utils";
import { IntentParser } from "./IntentParser";
import { Handler, TaskHandler } from "../abstract";
import { Task } from "../Task";

type HandlerClass = new (context: Context, agent: Agent) => Handler;

export type IHandlerFunction = (context: Context) => Promise<void>;

export type IHandler = HandlerClass | IHandlerFunction;
type Callback = (context: Context) => Promise<void> | void;

export type IntentParserFun = (context: Context, candidates: string[]) => Promise<void> | void;

export type EntitiesParser = (context: Context) => Promise<void> | void;

const MAIN_SYMBOL = Symbol("main");

type IntentType = string | symbol;

export interface AgentOptions {
  /**
   * Agent名称
   */
  name: string;
  /**
   * Agent描述
   */
  description: string;
}

/**
 * Agent
 * @example
 * ```ts
 * const agent = new Agent('agent1');
 * agent.setIntentClassifier((context, indicates) => {
 *   return "查询订单"
 * });
 * agent.setEntitiesParser(context => {
 *   return [{ name: "partName", "机油格"}]
 * });
 *
 * agent.registerSlots([Slot1, Slot2]);
 * agent.registerFormConfig('name', formConfig);
 *
 * agent.handle('查询订单', async context => {
 *   context.reply(new TextMessage('请告诉我订单号'));
 * })
 * ```
 */
export class Agent {
  constructor(public readonly agentId: string, private readonly options?: AgentOptions) { }

  /**
   * @deprecated 请使用agentId
   */
  get name() {
    return this.options?.name || this.agentId;
  }

  /**
   * agent名称
   */
  get agentName() {
    return this.options?.name || this.agentId;
  }

  /**
   * agent描述
   */
  get description() {
    return this.options?.description || "";
  }

  protected formConfigs: Record<string, FormConfig> = {};
  protected slotsConfigs: Record<string, SlotConfig> = {};
  private intentMap: Map<string | symbol, IHandlerFunction> = new Map();

  private background: boolean = false;

  setBackground(background: boolean) {
    this.background = background;
  }

  isBackground() {
    return this.background;
  }

  protected enterCallback?: (context: Context, prevAgent?: string) => Promise<void> | void;
  protected leaveCallback?: (context: Context, nextAgent?: string) => Promise<void> | void;

  protected entitiesParser?: EntitiesParser;

  /**
   * 意图分类，如果返回的值不再 candidates 内，会触发onMissMatch
   * @deprecated 请使用addIntentClassifier
   * @param classifier
   */
  setIntentParser(classifier: IntentParserFun) {
    this.classifiers[MAIN_SYMBOL] = {
      id: MAIN_SYMBOL,
      classify: async (context, categories) => {
        const names = categories.map((c) => c);
        await classifier(context, names.filter((name) => typeof name === "string") as string[]);
        const index = names.indexOf(context.intent);
        return categories[index] || FALLBACK_SYMBOL;
      },
    };
  }

  classifiers: Record<string | symbol, IClassifier> = {};

  /**
   * 为当前Agent添加意图分类器
   * @param classifier
   * @param isMain 是否为主分类器
   */
  registerIntentClassifier(classifier: IClassifier, isMain = false) {
    this.classifiers[classifier.id] = classifier;
    if (isMain) {
      this.classifiers[MAIN_SYMBOL] = classifier;
    }
  }

  /**
   * 配置实体解析，根据上下文解析实体
   * @param parser
   */
  setEntitiesParser(parser: EntitiesParser) {
    this.entitiesParser = parser;
  }

  /**
   * 注册槽
   * @param slotCtors
   */
  registerSlot(name: string, slotConfig: SlotConfig) {
    this.slotsConfigs[name] = slotConfig;
  }

  /**
   * 注册表单
   * @param formName
   * @param formConfig
   */
  registerForm(formName: string, formConfig: FormConfig) {
    this.formConfigs[formName] = formConfig;
  }

  /**
   * 获取表单
   * @param formName
   */
  getFormConfig(formName: string) {
    if (!this.formConfigs[formName]) {
      throw new Error(`Form ${formName} not found`);
    }
    return this.formConfigs[formName];
  }

  /**
   * 进入当前Agent时的回调
   * @param callback
   */
  onEnter(callback: Callback) {
    this.enterCallback = callback;
  }

  /**
   * 离开当前Agent时回调
   * @param callback
   */
  onLeave(callback: Callback) {
    this.leaveCallback = callback;
  }

  enter(context: Context, prevAgent?: string) {
    return this.enterCallback?.(context, prevAgent);
  }

  leave(context: Context, nextAgent?: string) {
    return this.leaveCallback?.(context, nextAgent);
  }

  private async executeSlotsFilling(context: Context) {
    // 如果为false,不自动填充槽位
    if (!context.autoFillSlots) {
      return;
    }
    const slots: SlotRecords = {};
    for (const [name, slot] of Object.entries(this.slotsConfigs)) {
      const slotValue = await slot.filling?.(context.entities, context);
      if (slotValue !== undefined) {
        slots[name] = slotValue;
      }
    }
    context.mergeSlots(slots);
  }

  private isHandlerClass(handler: IHandler): handler is HandlerClass {
    return typeof handler === "function" && handler.prototype instanceof Handler;
  }

  /**
   * 特定意图回调
   * @param intent
   * @param handler
   */
  handle(intent: IntentType | IntentType[], handler: IHandler) {
    const handlerFn = this.isHandlerClass(handler) ? (ctx: Context) => new handler(ctx, this).handle() : handler;
    const intents = Array.isArray(intent) ? intent : [intent];
    for (const _intent of intents) {
      if (this.intentMap.get(_intent)) {
        throw new Error(`Intent ${String(_intent)} already exists`);
      }
      this.intentMap.set(_intent, handlerFn);
    }
  }

  handleCommand(command: string, handler: IHandler) {
    this.handle(buildCommandIntent(command), handler);
  }

  /**
   * 没有匹配到意图时的回调
   * @param handler
   */
  handleFallback(handler: IHandler) {
    this.handle(FALLBACK_SYMBOL, handler);
  }

  private _taskHandler?: new (context: Context, task: Task<any>, agent: Agent) => TaskHandler<unknown>;

  /**
   * 处理特定任务的回调
   * @param handler
   */
  handleTask<T>(handler: new (context: Context, task: Task<T>, agent: Agent) => TaskHandler<T>) {
    this._taskHandler = handler;
  }

  /**
   * 执行intent对应的handler
   * @param context
   * @param intent
   */
  async executeHandler(context: Context, intent: IntentType) {
    let handler = this.intentMap.get(intent);

    // 如果intent以@开头，则认为是command
    // 没有实现command的handler时，打印错误日志，不处理
    if (!handler && String(intent).startsWith("@command")) {
      console.error(`Intent ${String(intent)} not found`);
      return;
    }

    // 如果没有找到对应的handler，使用fallback
    handler = handler || this.intentMap.get(FALLBACK_SYMBOL);
    if (handler) {
      await handler(context);
      return;
    }

    console.error(`Intent ${String(intent)}[${typeof intent}] not found`);
  }

  get categories() {
    return [...this.intentMap.keys()];
  }

  get preClassifiers() {
    const preClassifiers = {
      ...this.classifiers,
    };
    delete preClassifiers[MAIN_SYMBOL];
    return preClassifiers;
  }

  private async parseIntent(context: Context) {
    const lastMessage = context.lastMessage;
    if (lastMessage.type === "command") {
      return buildCommandIntent(lastMessage.command);
    }

    const mainClassifier = this.classifiers[MAIN_SYMBOL];

    if (mainClassifier) {
      const parser = new IntentParser(mainClassifier, this.preClassifiers);
      return parser.parse(context, this.categories);
    }

    return FALLBACK_SYMBOL;
  }

  /**
   * Agent 执行方法
   * @param context
   * @returns
   */
  async execute<T>(context: Context, nlu: INLU | Task<T> = {}) {
    if (Task.isTask(nlu)) {
      const H = this._taskHandler;
      if (!H) {
        throw new Error(`Task handler not found`);
      }
      const taskHandler = new H(context, nlu, this);
      await taskHandler.handle();
      return;
    }

    if (nlu.entities) {
      context.setEntities(nlu.entities);
    } else if (this.entitiesParser && !Array.isArray(context.lastMessage?.nlu?.entities)) {
      await this.entitiesParser(context);
    }

    let intent: IntentType | undefined = nlu.intent;
    if (!intent) {
      intent = await this.parseIntent(context);
    }

    context.setIntent(intent);

    context.memory.setSlotsConfig(this.slotsConfigs);

    // entities -> slots
    await this.executeSlotsFilling(context);
    if (nlu.slots) {
      context.mergeSlots(nlu.slots);
    }

    await this.executeHandler(context, context.intent);
  }
}
