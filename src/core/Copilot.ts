import { Application } from './Application';
import { Context, AgentResponse, Message } from '../types';

// Copilot 核心类
export class Copilot {
  applications: Map<string, Application>;

  constructor() {
    this.applications = new Map();
  }

  registerApplication(app: Application) {
    this.applications.set(app.name, app);
  }

  async chat(appName: string, userId: string, content: string): Promise<AgentResponse> {
    const app = this.applications.get(appName);
    if (!app) {
      return { content: `应用 ${appName} 不存在` };
    }

    // 构建上下文
    const context: Context = {
      messages: [
        {
          id: Date.now().toString(),
          content,
          role: 'user',
          timestamp: Date.now(),
        },
      ],
      userId,
      sessionId: `${userId}-${Date.now()}`,
    };

    return await app.process(context);
  }
}
