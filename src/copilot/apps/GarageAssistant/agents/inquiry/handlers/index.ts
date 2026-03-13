// ===========================
// inquiry Agent 的意图处理器
// 对应原项目：src/copilot/apps/GarageAssistant/agents/inquiry/handlers/
//
// 原项目每个 handler 是一个独立文件（如 appendPartsHandler.ts、buyTyreHandler.ts）
// 这里合并为一个文件，只保留骨架逻辑
// ===========================

import { IContext } from "../../../../../types";
import logger from "../../../../../common/logger";

/** 处理"买配件"意图：收集配件信息，引导用户发布询价 */
export async function handleBuyParts(context: IContext): Promise<void> {
  const { lastMessage } = context;
  logger.info(`[inquiryHandler] 处理买配件意图，消息: ${lastMessage.content}`);

  // 原项目这里会：
  // 1. 调用 LLM 解析配件名称、车型、VIN 码（slots 填充）
  // 2. 渲染富文本询价表单（richtext）
  // 3. 回复带 actions 的 markdown 消息

  context.reply({
    type: "markdown",
    content: `好的，我来帮您发布询价。\n\n**您需要的配件：** ${lastMessage.content}\n\n请提供车架号（VIN），以便精准匹配配件。`,
    fromUser: "system",
  });
}

/** 处理"查订单"意图 */
export async function handleCheckOrder(context: IContext): Promise<void> {
  logger.info("[inquiryHandler] 处理查订单意图");
  context.reply({
    type: "markdown",
    content: "请提供您的订单号（以 S 开头），我来帮您查询。",
    fromUser: "system",
  });
}
