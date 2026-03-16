import EventEmitter from "events";
import { MessageReporter as MessageReporterSchema } from "@/model/MessageReporter";

type IStepName = string;

type stepPhaseName = "start" | "progress" | "end" | "report";
interface IStep<T = unknown> {
  messageId: string;
  step: IStepName;
  parentStep?: IStepName;
  stepPhase: stepPhaseName;
  timestamps: number;
  data: T;
  message: string;
  duration?: number;
}

interface IStepOptions {
  // 是否保存，默认保存
  save?: boolean;
  parentStep?: IStepName;
  data?: unknown;
}
interface IProgressOptions extends IStepOptions {
  // 进度总数
  total?: number;
  //  当前进度
  current?: number;
  action?: "append" | "replace" | "done";
}
export class MessageReporter {
  private emitter = new EventEmitter();
  private stepTimestamps: Record<string, number> = {};
  private messageId: string = "";
  private reporterId = Math.random().toString(16);
  constructor(messageId: string) {
    this.messageId = messageId;
  }

  on(event: stepPhaseName, listener: (message: string, data: unknown) => void): void {
    this.emitter.on(event, listener);
  }
  /** 创建区间步骤 */
  step(step: IStepName, { parentStep }: { parentStep?: IStepName }) {
    this.stepTimestamps[step] = Date.now();
    return {
      /** 记录开始步骤 */
      start: (msg: string, opts?: IStepOptions) => {
        return this.stepStart(step, msg, { parentStep, ...opts });
      },
      /** 记录中间步骤 */
      progress: (msg: string, opts?: IProgressOptions) => {
        return this.stepProgress(step, msg, { parentStep, ...opts });
      },
      /** 记录结束步骤 */
      end: (msg: string, opts?: IStepOptions) => {
        return this.stepEnd(step, msg, { parentStep, ...opts });
      },
      /** 创建子步骤 */
      step: (childStep: IStepName) => {
        return this.step(childStep, { parentStep: step });
      },
    };
  }
  /** 记录步骤 */
  report(step: IStepName, message: string, options: IStepOptions) {
    const { save = true, data, parentStep } = options;
    const timestamps = Date.now();
    this.emitter.emit("report", message, options);
    if (!save) {
      return;
    }
    this.saveStep({
      stepPhase: "report",
      messageId: this.messageId,
      message,
      parentStep,
      data,
      step,
      timestamps,
      duration: timestamps - this.stepTimestamps[step],
    });
  }
  private stepStart(step: IStepName, message: string, options: IStepOptions) {
    const { save = true, data, parentStep } = options;
    const timestamps = Date.now();
    this.stepTimestamps[step] = timestamps;
    this.emitter.emit("start", message, options);
    if (!save) {
      return;
    }
    this.saveStep({
      stepPhase: "start",
      messageId: this.messageId,
      message,
      parentStep,
      data,
      step,
      timestamps,
    });
  }
  private stepProgress(step: IStepName, message: string, options: IProgressOptions) {
    const { save = true, data, parentStep } = options;
    const timestamps = Date.now();
    this.emitter.emit("progress", message, options);
    if (!save) {
      return;
    }
    this.saveStep({
      stepPhase: "progress",
      messageId: this.messageId,
      parentStep,
      message,
      data,
      step,
      timestamps,
    });
  }
  private stepEnd(step: IStepName, message: string, options: IStepOptions) {
    const { save = true, data, parentStep } = options;
    const timestamps = Date.now();
    this.emitter.emit("end", message, options);
    if (!save) {
      return;
    }
    this.saveStep({
      stepPhase: "end",
      messageId: this.messageId,
      parentStep,
      message,
      data,
      step,
      timestamps,
      duration: timestamps - this.stepTimestamps[step],
    });
  }
  private saveStep(stepItem: IStep) {
    MessageReporterSchema.create({
      reporterId: this.reporterId,
      ...stepItem,
      data: JSON.stringify(stepItem.data || {}),
    }).catch((err: any) => {
      console.log("saveStep err", err);
    });
  }
  /** 修改记录的MessageId */
  async modifyMessages({ messageId }: { messageId: string }) {
    if (!messageId || messageId === this.messageId) {
      return;
    }
    try {
      const messages = await MessageReporterSchema.find({ messageId: this.messageId });
      const promises = messages.map((msg: any) => {
        msg.messageId = messageId;
        return msg.save();
      });
      await Promise.all(promises);
    } catch (err) {
      console.log("修改message reporter异常", (err as Error).message);
    }
  }
}
