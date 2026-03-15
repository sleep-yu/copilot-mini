import type { Agent, IClassifier } from "../agent";
import type { Context } from "../context";
import { Router } from "../Router";
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
export declare class Application {
  readonly appId: string;
  readonly router: Router;
  readonly options: IApplicationOptions;
  /**
   * @param appId 应用名称，应用唯一标识
   */
  constructor(appId: string, options?: IApplicationOptions);
  get name(): string;
  get description(): string;
  /**
   * @deprecated use `appId` instead
   */
  get appName(): string;
  setBackgroundAgent(agent: Agent): void;
  onBeforeRoute(beforeRoute: (context: Context) => Promise<void>): void;
  /**
   * 配置场景分类器，返回对应的AgentId
   * @param classifier
   */
  setClassifier(classifier: IClassifier): void;
  /**
   * @deprecated use `setClassifier` instead
   * @param classifier
   * @returns
   */
  setSceneClassifier(classifier: IClassifier): void;
  fallbackAgent: Agent | undefined;
  /**
   * 注册Agent
   * @param agent
   * @param { fallback: boolean } options 是否为兜底Agent
   */
  registerAgent(agent: Agent, { fallback }?: {
    fallback: boolean;
  }): void;
  /**
   * 获取当前应用的所有Agent
   * 注意：不包含 background Agent
   */
  get agents(): Record<string, Agent>;
}
