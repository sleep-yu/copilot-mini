// 消息类型定义
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

// 对话上下文
export interface Context {
  messages: Message[];
  userId: string;
  sessionId: string;
}

// Agent 响应
export interface AgentResponse {
  content: string;
  actions?: Action[];
}

// 按钮动作
export interface Action {
  label: string;
  type: string;
  data?: any;
}
