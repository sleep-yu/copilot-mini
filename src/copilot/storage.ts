import { IContextData, IStorage } from "@/interface/storage";
import { ContextValue } from "@/model/ContextValue";
import { CopilotMessage } from "@/model/CopilotMessage";
import _ from "lodash";
import { AppId } from "@/common/enums";

export const storage: IStorage = {
  async getItemAsync(id) {
    const [contextValue, historyMessages] = await Promise.all([
      ContextValue.findOne({ sessionId: id }, { _id: 0, id: 0 }),
      CopilotMessage.find({ sessionId: id }, { amrBase64Content: 0 }).sort({ createdAt: -1 }).limit(100),
    ]);
    return {
      app: AppId.Question_Answer,
      ...contextValue?.toJSON(),
      // 排除record和command，只保留用户可见的对话内容
      historyMessages: _.orderBy(
        historyMessages.map((item) => item.toJSON()),
        "createdAt",
        "asc"
      ).filter((message) => !["record", "command"].includes(message.type)),
    } as IContextData;
  },
  async setItemAsync(id, data) {
    await ContextValue.updateOne(
      { sessionId: id },
      {
        $set: {
          ...data,
          sessionId: id,
        },
      },
      { upsert: true }
    )
  }
};
