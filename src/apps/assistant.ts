import { Application } from '../core/Application';
import { SimpleQAAgent } from '../agents/SimpleQAAgent';

// 创建助手应用
export const assistantApp = new Application('assistant');

// 注册 Agent
assistantApp.registerAgent(new SimpleQAAgent());
