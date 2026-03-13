// ===========================
// fallback Agent
// 对应原项目：src/copilot/apps/GarageAssistant/agents/fallback/index.ts
//
// 原项目：调用 LLM 生成流式回复，关联 QA 知识库
// 这里：简化为固定回复，保留相同骨架
// ===========================

import { Agent, FALLBACK_SYMBOL } from "../../../../Agent";
import { AgentId, Intents } from "../../../../constants";
import logger from "../../../../../common/logger";

const agent = new Agent(AgentId.fallbackAgent, {
  name: "兜底回复 Agent",
  description: "处理其他所有 Agent 无法处理的问题。",
});

agent.setIntentParser(async (context) => {
  context.setIntent(Intents.askQuestion);
});

agent.onEnter(() => {
  logger.info("[fallbackAgent] 进入 fallback Agent");
});

agent.onLeave(() => {
  logger.info("[fallbackAgent] 离开 fallback Agent");
});

/**
 * 兜底处理
 * 原项目：
 *   1. 改写用户输入（LLM）
 *   2. 检索相关 QA
 *   3. 调用 generateFallbackStreamText 流式生成回复
 *   4. 根据回复内容动态追加 actions（客服按钮、发布询价等）
 */
agent.handle([Intents.askQuestion, FALLBACK_SYMBOL], async (context) => {
  const { lastMessage } = context;
  logger.info(`[fallbackAgent] 兜底处理，消息: ${lastMessage.content}`);

  // 原项目这里调用 LLM 生成流式回复
  context.reply({
    type: "markdown",
    content: `您好，我是智能采购助手。\n\n您的问题：「${lastMessage.content}」\n\n很抱歉暂时无法精确回答，建议您点击「人工客服」获取帮助。`,
    fromUser: "system",
  });
});

export default agent;
