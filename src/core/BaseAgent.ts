import { Context, AgentResponse } from '../types';

// 基础 Agent 类
export class BaseAgent {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  async handle(context: Context): Promise<AgentResponse> {
    throw new Error('子类必须实现 handle 方法');
  }
}
