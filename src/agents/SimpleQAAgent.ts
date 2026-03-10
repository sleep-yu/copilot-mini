import { BaseAgent } from '../core/BaseAgent';
import { Context, AgentResponse } from '../types';

// 简单问答 Agent
export class SimpleQAAgent extends BaseAgent {
  constructor() {
    super('SimpleQA');
  }

  async handle(context: Context): Promise<AgentResponse> {
    const userMessage = context.messages[context.messages.length - 1].content;

    // 简单的规则匹配
    if (userMessage.includes('你好') || userMessage.includes('hello')) {
      return {
        content: '你好！我是智能助手，有什么可以帮你的吗？',
        actions: [
          { label: '查询配件', type: 'query', data: { type: 'parts' } },
          { label: '联系客服', type: 'contact', data: { type: 'service' } },
        ],
      };
    }

    if (userMessage.includes('配件')) {
      return {
        content: '请告诉我你需要什么配件，我来帮你查询。',
      };
    }

    return {
      content: `收到你的消息：${userMessage}`,
    };
  }
}
