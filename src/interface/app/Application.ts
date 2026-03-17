import type { Agent, IClassifier } from "../agent";
import type { Context } from "../context";
import { Router } from "../Router";
import { Session } from "../session";

export interface IApplicationOptions {
  /**
   * Session过期时间，单位毫秒
   */
  sessionExpireTime?: number;
  /**
   * 应用名称
   */
  name?: string;
  /**
   * 应用描述
   */
  description?: string;
}
/**
 * Copilot 应用
 */
export class Application {
  readonly router = new Router();
  readonly options: IApplicationOptions;
  /**
   * @param appId 应用名称，应用唯一标识
   */
  constructor(public readonly appId: string, options: IApplicationOptions = {}) {
    const { sessionExpireTime } = options;
    if (sessionExpireTime) {
      Session.registerExpiresIn(appId, sessionExpireTime);
    }
    this.options = options;
  }
  get name() {
    return this.options.name || this.appId;
  }

  get description() {
    return this.options.description || "";
  }

  /**
  * @deprecated use `appId` instead
  */
  get appName() {
    return this.options.name || this.appId;
  }
  setBackgroundAgent(agent: Agent) {
    this.router.setBackground(agent);
  }
  onBeforeRoute(beforeRoute: (context: Context) => Promise<void>) {
    this.router.onBeforeRoute(beforeRoute);
  }
  /**
   * 配置场景分类器，返回对应的AgentId
   * @param classifier
   */
  setClassifier(classifier: IClassifier) {
    this.router.setClassifier(async (context, candidates) => {
      const item = await classifier.classify(context, candidates);
      return item;
    });
  }
  /**
   * @deprecated use `setClassifier` instead
   * @param classifier
   * @returns
   */
  setSceneClassifier(classifier: IClassifier) {
    return this.setClassifier(classifier);
  }
  fallbackAgent: Agent | undefined;
  /**
   * 注册Agent
   * @param agent
   * @param { fallback: boolean } options 是否为兜底Agent
   */
  registerAgent(agent: Agent, { fallback = false }: { fallback: boolean } = { fallback: false }) {
    if (fallback) {
      if (this.fallbackAgent) {
        throw new Error("fallback agent already exists");
      }
      this.fallbackAgent = agent;
    }
    this.router.route(agent);
  }
  /**
   * 获取当前应用的所有Agent
   * 注意：不包含 background Agent
   */
  get agents() {
    return this.router.agents;
  }
}
