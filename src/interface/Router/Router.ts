import type { Agent } from "../agent";
import type { Context } from "../context";
/**
 * 可选的类别中选出当前场景
 */
export type Classifier = (context: Context, candidates: (string | symbol)[]) => Promise<string | symbol> | (string | symbol);
/**
 * 根据上下文，将消息路由给相应的agent处理
 * @example
 * ```ts
 * const router = new Router();
 *
 * router.setClassifier((context, candidates) => {
 *   // return the best candidate
 * })
 *
 * router.handle(scene, agent);
 * ```
 */
export declare class Router {
  private classifier?;
  private sceneMap;
  /**
   * 注册的agents
   */
  get agents(): Record<string, Agent>;
  /**
   * 场景分类器，判断当前用户属于哪个场景
   * @param classifier
   */
  setClassifier(classifier: Classifier): void;
  /**
   * 注册路由，不同场景到不同Agent
   * @param scenes
   * @param agent
   */
  route(agent: Agent): void;
  /**
   * 后台Agent
   */
  protected backgroundAgent: Agent | undefined;
  /**
   * 配置后台Agent
   * @param agent
   */
  setBackground(agent: Agent): void;
  private beforeRoute?;
  /**
   * 路由前执行该中间件
   * @param beforeRoute
   */
  onBeforeRoute(beforeRoute: (context: Context) => Promise<void>): void;
  execute(context: Context): Promise<void>;
}
