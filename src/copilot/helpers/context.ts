/**
 * Copilot Context 辅助函数
 * 对应原项目：src/copilot/helpers/context.ts
 *
 * 原项目依赖 @casstime/copilot-core 的 IServiceContext，提供 slot 读写、消息查询等
 * mini 版本基于本地 IContext 接口实现
 */

import { IContext, IMessage } from "../../types";

/**
 * 获取 slot 值
 * @param context 当前对话上下文
 * @param key slot 名称
 */
export function getSlot<T = unknown>(context: IContext, key: string): T | undefined {
  return context.slots[key] as T | undefined;
}

/**
 * 设置 slot 值
 * @param context 当前对话上下文
 * @param key slot 名称
 * @param value slot 值
 */
export function setSlot<T = unknown>(context: IContext, key: string, value: T): void {
  context.slots[key] = value;
}

/**
 * 获取上一条用户文本消息内容
 * 原项目：从 historyMessages 反向查找最近一条 type=text 的用户消息
 * @param context 当前对话上下文
 * @returns 最后一条文本消息，若无则返回 undefined
 */
export function getLastTextMessage(context: IContext): IMessage | undefined {
  const messages = [...context.historyMessages, context.lastMessage];
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.type === "text" && msg.fromUser !== "system") {
      return msg;
    }
  }
  return undefined;
}
