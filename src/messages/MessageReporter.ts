/**
 * 消息上报器
 * 对应原项目：src/messages/MessageReporter.ts
 *
 * 原项目使用 EventEmitter + MongoDB 存储每一步执行日志，用于可观测性追踪
 * mini 版本简化为打印日志，保留相同的接口形状
 */

import logger from "../common/logger";

export type StepPhase = "start" | "progress" | "end" | "report";

export interface ReportContext {
  messageId?: string;
  sessionId?: string;
  agentId?: string;
  [key: string]: unknown;
}

export class MessageReporter {
  private messageId: string;

  constructor(messageId: string) {
    this.messageId = messageId;
  }

  /**
   * 上报消息执行步骤
   * @param message 步骤描述
   * @param context 上下文（agentId、sessionId 等）
   */
  report(message: string, context?: ReportContext): void {
    logger.info(
      {
        type: "message_report",
        messageId: this.messageId,
        ...context,
      },
      `[MessageReporter] ${message}`
    );
  }

  /**
   * 创建带阶段标记的步骤上报
   * 原项目：step(...).start() / .progress() / .end()
   */
  step(stepName: string) {
    const report = (phase: StepPhase, msg: string, data?: unknown) => {
      logger.info(
        {
          type: "message_step",
          messageId: this.messageId,
          step: stepName,
          phase,
          data,
        },
        `[MessageReporter:${stepName}:${phase}] ${msg}`
      );
    };

    return {
      start: (msg: string, data?: unknown) => report("start", msg, data),
      progress: (msg: string, data?: unknown) => report("progress", msg, data),
      end: (msg: string, data?: unknown) => report("end", msg, data),
    };
  }
}
