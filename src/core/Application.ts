import { BaseAgent } from './BaseAgent';
import { Context, AgentResponse } from '../types';

// 应用类
export class Application {
  name: string;
  agents: BaseAgent[];

  constructor(name: string) {
    this.name = name;
    this.agents = [];
  }

  registerAgent(agent: BaseAgent) {
    this.agents.push(agent);
  }

  async process(context: Context): Promise<AgentResponse> {
    // 简化版：直接用第一个 agent 处理
    if (this.agents.length > 0) {
      return await this.agents[0].handle(context);
    }
    return { content: '没有可用的 Agent' };
  }
}
