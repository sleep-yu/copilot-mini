// 简化版内存 Storage，对应原项目 src/copilot/storage.ts
// 原项目用 MongoDB (ContextValue + CopilotMessage)，这里用 Map 代替

import { IStorage, IContextData } from "../types";

const store = new Map<string, IContextData>();

export const storage: IStorage = {
  async getItemAsync(sessionId: string): Promise<IContextData> {
    return (
      store.get(sessionId) ?? {
        sessionId,
        appName: "GarageAssistant",
        historyMessages: [],
        slots: {},
      }
    );
  },

  async setItemAsync(sessionId: string, data: IContextData): Promise<void> {
    store.set(sessionId, { ...data, sessionId });
  },
};
