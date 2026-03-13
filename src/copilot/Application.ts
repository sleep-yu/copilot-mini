// ===========================
// Application 类
// 对应原项目 @casstime/copilot-core 的 Application
//
// 原项目用法：
//   const app = new Application(AppId.GarageAssistant, { name, description });
//   app.setClassifier(classifier);
//   app.setBackgroundAgent(bgAgent);
//   app.registerAgent(inquiryAgent);
//   app.registerAgent(fallbackAgent, { fallback: true });
//   app.onBeforeRoute(middleware);
// ===========================

import { IContext, IClassifier } from "../types";
import { Agent } from "./Agent";
import logger from "../common/logger";

interface ApplicationOptions {
  name: string;
  description: string;
  sessionExpireTime?: number;
}

interface RegisterOptions {
  fallback?: boolean;
}

type BeforeRouteFn = (context: IContext) => Promise<void>;

export class Application {
  appId: string;
  name: string;
  description: string;

  private classifier?: IClassifier;
  private agents: Map<string, Agent> = new Map();
  private fallbackAgent?: Agent;
  private backgroundAgent?: Agent;
  private beforeRouteHook?: BeforeRouteFn;

  constructor(appId: string, options: ApplicationOptions) {
    this.appId = appId;
    this.name = options.name;
    this.description = options.description;
  }

  /** 设置场景分类器，决定消息路由到哪个 Agent */
  setClassifier(classifier: IClassifier) {
    this.classifier = classifier;
  }

  /** 设置后台 Agent（原项目用于推送通知等后台任务） */
  setBackgroundAgent(agent: Agent) {
    this.backgroundAgent = agent;
  }

  /** 注册 Agent */
  registerAgent(agent: Agent, options: RegisterOptions = {}) {
    if (options.fallback) {
      this.fallbackAgent = agent;
    } else {
      this.agents.set(agent.agentId, agent);
    }
  }

  /** 路由前中间件（原项目用于鉴权、初始化等） */
  onBeforeRoute(fn: BeforeRouteFn) {
    this.beforeRouteHook = fn;
  }

  /** 处理一条用户消息，由 Copilot 调用 */
  async handle(context: IContext) {
    // 1. 执行路由前中间件
    if (this.beforeRouteHook) {
      await this.beforeRouteHook(context);
    }

    // 2. 用分类器决定路由到哪个 Agent
    let targetAgentId: string | undefined;
    if (this.classifier) {
      targetAgentId = await this.classifier.classify(context);
    }

    const agent =
      (targetAgentId ? this.agents.get(targetAgentId) : undefined) ??
      this.fallbackAgent;

    if (!agent) {
      logger.warn(`[Application:${this.appId}] 找不到目标 Agent，消息丢弃`);
      return;
    }

    logger.info(`[Application:${this.appId}] 路由到 Agent: ${agent.agentId}`);
    await agent.process(context);
  }
}
