import { ICopilotMessage } from "@/model/CopilotMessage";
import _ from 'lodash';
import { ContextValue } from "@/model/ContextValue";
import dayjs from "dayjs";
import logger from "../logger/logger";
import assert from "node:assert";
import { getApolloConfig, isDev } from "./env";

export const sendPollingErrorToWechat = async (requestId: string | undefined, messages: ICopilotMessage[]) => {
  try {
    const minCreatedAt = _.minBy(messages, "createdAt")?.createdAt;
    const lastMsg = messages[messages.length - 1];
    const seconds = (Date.now() - minCreatedAt!) / 1000;
    const contextValue = await ContextValue.findOne({ sessionId: lastMsg.sessionId });
    const cellphone = contextValue?.agentMemories?.["inquiry-agent"]?.slots?.user?.cellphone;
    const dialogueId = contextValue?.dialogueId;
    await sendMessageToWechat(`
### copilot-server异常
- 异常类型：轮询消息超过${seconds.toFixed(0)}秒未结束
- requestId: ${requestId}
- dialogueId: ${dialogueId}
- sessionId: ${lastMsg.sessionId}
- 手机号: ${cellphone}
- 时间: ${dayjs(lastMsg.updatedAt).format("YYYY-MM-DD HH:mm:ss")}
- message:  ${JSON.stringify(lastMsg)}
`);
  } catch (error) {
    assert(error instanceof Error);
    logger.error("sendPollingErrorToWechat异常", error.message, error.stack);
  }
};

export const sendMessageToWechat = async (markdownContent: string) => {
  try {
    if (isDev()) {
      // 调试环境不发送
      logger.error('调试环境不推送企微，消息内容：', markdownContent);
      return;
    }
    const key = getApolloConfig("WECHAT_ERROR_KEY");
    await fetch(`https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${key}`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        msgtype: "markdown",
        markdown: {
          content: markdownContent,
        },
      }),
    });
  } catch (error) {
    assert(error instanceof Error);
    logger.error("发送企微异常", error.message, error.stack);
  }
}
