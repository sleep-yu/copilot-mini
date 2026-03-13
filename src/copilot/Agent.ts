// ===========================
// Agent 类
// 对应原项目 @casstime/copilot-core 的 Agent
//
// 原项目用法：
//   const agent = new Agent(AgentId.inquiryAgent, { name, description });
//   agent.setIntentParser(async (ctx) => { ctx.setIntent("买配件") });
//   agent.handle(["买配件"], async (ctx) => { ... });
//   agent.onEnter(() => logger.info("进入 Agent"));
//   agent.onLeave(() => logger.info("离开 Agent"));
// ===========================

import { IContext, HandlerFn, IntentParserFn } from "../types";
import logger from "../common/logger";

const FALLBACK_SYMBOL = "__FALLBACK__";

interface AgentOptions {
  name: string;
  description: string;
}

export class Agent {
  agentId: string;
  name: string;
  description: string;

  private intentParser?: IntentParserFn;
  private handlers: Map<string, HandlerFn> = new Map();
  private fallbackHandler?: HandlerFn;
  private enterHook?: () => void;
  private leaveHook?: () => void;

  constructor(agentId: string, options: AgentOptions) {
    this.agentId = agentId;
    this.name = options.name;
    this.description = options.description;
  }

  /** 设置意图解析器，进入 Agent 后先执行 */
  setIntentParser(fn: IntentParserFn) {
    this.intentParser = fn;
  }

  /**
   * 注册意图处理器
   * intents 传 [FALLBACK_SYMBOL] 表示兜底处理
   */
  handle(intents: string[], fn: HandlerFn) {
    for (const intent of intents) {
      if (intent === FALLBACK_SYMBOL) {
        this.fallbackHandler = fn;
      } else {
        this.handlers.set(intent, fn);
      }
    }
  }

  /** Agent 进入钩子 */
  onEnter(fn: () => void) {
    this.enterHook = fn;
  }

  /** Agent 离开钩子 */
  onLeave(fn: () => void) {
    this.leaveHook = fn;
  }

  /** 由 Application 调用，处理当前消息 */
  async process(context: IContext) {
    this.enterHook?.();

    if (this.intentParser) {
      await this.intentParser(context);
    }

    const intent = context.getIntent();
    const handler = this.handlers.get(intent) ?? this.fallbackHandler;

    if (handler) {
      await handler(context);
    } else {
      logger.warn(`[Agent:${this.agentId}] 没有找到意图 "${intent}" 的处理器`);
    }

    this.leaveHook?.();
  }
}

export { FALLBACK_SYMBOL };
