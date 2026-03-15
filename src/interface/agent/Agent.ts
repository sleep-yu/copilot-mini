import type { Context } from "../context";
import type { FormConfig } from "../form";
import { SlotConfig as SlotConfig } from "../slots";
import type { INLU } from "../messages";
import { IClassifier } from "../classifier/Classifier";
import { Handler, TaskHandler } from "../abstract";
import { Task } from "../Task";
type HandlerClass = new (context: Context, agent: Agent) => Handler;
export type IHandlerFunction = (context: Context) => Promise<void>;
export type IHandler = HandlerClass | IHandlerFunction;
type Callback = (context: Context) => Promise<void> | void;
export type IntentParserFun = (context: Context, candidates: string[]) => Promise<void> | void;
export type EntitiesParser = (context: Context) => Promise<void> | void;
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
export declare class Agent {
  readonly agentId: string;
  private readonly options?;
  constructor(agentId: string, options?: AgentOptions | undefined);
  /**
   * @deprecated 请使用agentId
   */
  get name(): string;
  /**
   * agent名称
   */
  get agentName(): string;
  /**
   * agent描述
   */
  get description(): string;
  protected formConfigs: Record<string, FormConfig>;
  protected slotsConfigs: Record<string, SlotConfig>;
  private intentMap;
  private background;
  setBackground(background: boolean): void;
  isBackground(): boolean;
  protected enterCallback?: (context: Context, prevAgent?: string) => Promise<void> | void;
  protected leaveCallback?: (context: Context, nextAgent?: string) => Promise<void> | void;
  protected entitiesParser?: EntitiesParser;
  /**
   * 意图分类，如果返回的值不再 candidates 内，会触发onMissMatch
   * @deprecated 请使用addIntentClassifier
   * @param classifier
   */
  setIntentParser(classifier: IntentParserFun): void;
  classifiers: Record<string | symbol, IClassifier>;
  /**
   * 为当前Agent添加意图分类器
   * @param classifier
   * @param isMain 是否为主分类器
   */
  registerIntentClassifier(classifier: IClassifier, isMain?: boolean): void;
  /**
   * 配置实体解析，根据上下文解析实体
   * @param parser
   */
  setEntitiesParser(parser: EntitiesParser): void;
  /**
   * 注册槽
   * @param slotCtors
   */
  registerSlot(name: string, slotConfig: SlotConfig): void;
  /**
   * 注册表单
   * @param formName
   * @param formConfig
   */
  registerForm(formName: string, formConfig: FormConfig): void;
  /**
   * 获取表单
   * @param formName
   */
  getFormConfig(formName: string): FormConfig;
  /**
   * 进入当前Agent时的回调
   * @param callback
   */
  onEnter(callback: Callback): void;
  /**
   * 离开当前Agent时回调
   * @param callback
   */
  onLeave(callback: Callback): void;
  enter(context: Context, prevAgent?: string): void | Promise<void> | undefined;
  leave(context: Context, nextAgent?: string): void | Promise<void> | undefined;
  private executeSlotsFilling;
  private isHandlerClass;
  /**
   * 特定意图回调
   * @param intent
   * @param handler
   */
  handle(intent: IntentType | IntentType[], handler: IHandler): void;
  handleCommand(command: string, handler: IHandler): void;
  /**
   * 没有匹配到意图时的回调
   * @param handler
   */
  handleFallback(handler: IHandler): void;
  private _taskHandler?;
  /**
   * 处理特定任务的回调
   * @param handler
   */
  handleTask<T>(handler: new (context: Context, task: Task<T>, agent: Agent) => TaskHandler<T>): void;
  /**
   * 执行intent对应的handler
   * @param context
   * @param intent
   */
  executeHandler(context: Context, intent: IntentType): Promise<void>;
  get categories(): (string | symbol)[];
  get preClassifiers(): {
    [x: string]: IClassifier;
    [x: symbol]: IClassifier;
  };
  private parseIntent;
  /**
   * Agent 执行方法
   * @param context
   * @returns
   */
  execute<T>(context: Context, nlu?: INLU | Task<T>): Promise<void>;
}
export { };
