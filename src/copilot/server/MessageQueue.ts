import logger from "@/common/logger/logger";
import { IMessage } from "@/interface/messages";
import EventEmitter from "node:events";

interface MessageQueue<T> {
  on(ev: "consumed", handler: (result: T) => void): this;
}

/**
 * 消息队列，用于顺序处理消息, 防止重复处理
 */
class MessageQueue<T> extends EventEmitter {
  constructor(private consumer: (message: IMessage) => Promise<T>) {
    super()
  }

  private queuedMessages: IMessage[] = [];
  private running?: Promise<void>;
  /**
   * 将消息推入队列
   * @param message 
   */
  push(message: IMessage) {
    // 如果前面有重复的，先删除，以免重复处理
    if (message.id) {
      this.queuedMessages = this.queuedMessages.filter((m) => m.id !== message.id);
    }
    this.queuedMessages.push(message);
    // 触发消费
    this.consume();
  }

  private consume() {
    if (this.running || this.queuedMessages.length === 0) {
      return;
    }
    this.running = this.consumeAll();
  }
  /**
   * 顺序消费所有消息
   */
  private async consumeAll(): Promise<void> {
    while (this.queuedMessages.length > 0) {
      const message = this.queuedMessages.shift();
      if (message) {
        try {
          const result = await this.consumer(message);
          this.emit("consumed", result);
        } catch (error) {
          logger.error("consume message error", error);
        }
      }
    }
    this.running = undefined;
  }

  /**
 * 等待队列清空
 */
  async waitQueueEmpty() {
    await this.running;
  }
}

export default MessageQueue