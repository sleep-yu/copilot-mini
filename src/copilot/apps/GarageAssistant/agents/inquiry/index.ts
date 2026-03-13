// ===========================
// inquiry Agent
// 对应原项目：src/copilot/apps/GarageAssistant/agents/inquiry/agent/index.ts
//
// 原项目是 LLMAgent（继承自 Agent），使用 LLM 做意图识别 + 工具调用
// 这里简化为规则判断，保留相同的代码结构骨架
// ===========================

import { Agent, FALLBACK_SYMBOL } from "../../../../Agent";
import { AgentId, Intents } from "../../../../constants";
import { handleBuyParts, handleCheckOrder } from "./handlers";
import logger from "../../../../../common/logger";

const agent = new Agent(AgentId.inquiryAgent, {
  name: "询价 Agent",
  description: "处理用户的配件询价请求，引导用户发布询价单。",
});

/**
 * 意图解析器
 * 原项目：调用 intentClassifier（LLM分类）判断意图
 * 这里：用关键词规则简化
 */
agent.setIntentParser(async (context) => {
  const text = context.lastMessage.content ?? "";

  if (/配件|刹车|机油|轮胎|询价/.test(text)) {
    context.setIntent(Intents.buyParts);
  } else if (/订单|查单/.test(text)) {
    context.setIntent("查订单");
  } else {
    context.setIntent(FALLBACK_SYMBOL);
  }
});

agent.onEnter(() => {
  logger.info("[inquiryAgent] 进入 inquiry Agent");
});

agent.onLeave(() => {
  logger.info("[inquiryAgent] 离开 inquiry Agent");
});

// 处理"买配件"意图
agent.handle([Intents.buyParts], handleBuyParts);

// 处理"查订单"意图
agent.handle(["查订单"], handleCheckOrder);

// 兜底：无法识别的意图，切换到 fallback Agent
agent.handle([FALLBACK_SYMBOL], async (context) => {
  await context.activateAgent(AgentId.fallbackAgent);
});

export default agent;
