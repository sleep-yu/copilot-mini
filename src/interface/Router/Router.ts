import type { Agent } from "../agent";
import type { Context } from "../context";

/**
 * 可选的类别中选出当前场景
 */
export type Classifier = (
  context: Context,
  candidates: (string | symbol)[]
) => Promise<string | symbol> | (string | symbol);

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
export class Router {
  private classifier?: Classifier;

  private sceneMap: Map<string | symbol, Agent> = new Map();

  /**
   * 注册的agents
   */
  get agents() {
    let records: Record<string, Agent> = {};
    for (const agent of this.sceneMap.values()) {
      records[agent.agentId] = agent;
    }
    return records;
  }

  /**
   * 场景分类器，判断当前用户属于哪个场景
   * @param classifier
   */
  setClassifier(classifier: Classifier) {
    this.classifier = classifier;
  }

  /**
   * 注册路由，不同场景到不同Agent
   * @param scenes
   * @param agent
   */
  route(agent: Agent) {
    if (!this.classifier) {
      throw new Error("Classifier is not set");
    }

    this.sceneMap.set(agent.agentId, agent);
  }

  /**
   * 后台Agent
   */
  protected backgroundAgent: Agent | undefined;

  /**
   * 配置后台Agent
   * @param agent
   */
  setBackground(agent: Agent) {
    agent.setBackground(true);
    this.backgroundAgent = agent;
  }

  private beforeRoute?: (context: Context) => Promise<void>;
  /**
   * 路由前执行该中间件
   * @param beforeRoute
   */
  onBeforeRoute(beforeRoute: (context: Context) => Promise<void>) {
    this.beforeRoute = beforeRoute;
  }

  async execute(context: Context) {
    await this.beforeRoute?.(context);

    let agent: Agent | undefined;
    if (context.background && this.backgroundAgent) {
      await context.routeTo(this.backgroundAgent);
      return;
    }
    // 如果消息指定Agent,路由到该Agent,否则路由到上一条消息的Agent
    const messageNlu = context.lastMessage?.nlu || {};
    const specialAgentId = messageNlu.agentId || messageNlu.agentName;
    const prevAgentId = context.prevMessageAgent;
    const agentId = specialAgentId || prevAgentId;
    /**
     * 只有第一次路由才会继承Agent
     */
    if (agentId && context.routeTimes === 0) {
      agent = this.agents[agentId];
    }
    if (!agent) {
      const agentEntries = this.sceneMap.entries();
      const validAgents = Array.from(agentEntries)
        .filter(([agentId, agent]) => !context.missMatchedAgents.has(agent.agentId))
        .map(([scene, agent]) => agent);

      if (!validAgents.length) {
        throw new Error("No valid scenes found");
      }
      if (!this.classifier) {
        throw new Error("Classifier is not set");
      }

      const validAgentIds = validAgents.map((agent) => agent.agentId);
      const scene = await this.classifier(context, validAgentIds);
      agent = this.sceneMap.get(scene);
    }

    if (!agent) {
      throw new Error(`No agent found`);
    }

    await context.routeTo(agent);
  }
}
