// ===========================
// GarageAssistant Application
// 对应原项目：src/copilot/apps/GarageAssistant/index.ts
//
// 原项目注册了 6 个 Agent：inquiry / fallback / partInfo / background / products / tyre
// 这里只保留 inquiry + fallback 核心骨架
// ===========================

import { Application } from "../../Application";
import { AppId, AgentId } from "../../constants";
import inquiryAgent from "./agents/inquiry";
import fallbackAgent from "./agents/fallback";

// 场景分类器：决定消息路由到哪个 Agent
// 原项目：对话历史+LLM分类，这里固定路由到 inquiryAgent
const classifier = {
  id: "SCENE_CLASSIFIER",
  classify: async () => AgentId.inquiryAgent,
};

const app = new Application(AppId.GarageAssistant, {
  sessionExpireTime: 4 * 60 * 60 * 1000,
  name: "智能采购助手",
  description: "帮助用户发布询价单并解答汽配相关问题。",
});

// 设置场景分类器
app.setClassifier(classifier);

// 注册 Agent
app.registerAgent(inquiryAgent);
app.registerAgent(fallbackAgent, { fallback: true });

export default app;
