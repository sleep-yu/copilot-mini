import mongoose, { Schema, Document } from "mongoose";

export interface IMessageReporter {
  messageId: string;
  reporterId: string;
  message: string;
  step: string;
  stepPhase: "start" | "progress" | "end" | "report";
  parentStep?: string;
  data: string;
  timestamps: number;
  duration?: number;
  // 进度总数
  total?: number;
  //  当前进度
  current?: number;
}

const schema = new Schema(
  {
    messageId: { type: String, required: true, index: true },
    reporterId: { type: String, required: false },
    message: { type: String, required: false },
    step: { type: String, required: true },
    parentStep: { type: String, required: false },
    stepPhase: { type: String, required: true },
    data: { type: String, required: true },
    timestamps: { type: Number, required: true },
    current: { type: Number, required: false },
    total: { type: Number, required: false },
    duration: { type: Number, required: false },
  },
  {
    timestamps: true,
  }
);

export type MessageReporterDoc = Document<IMessageReporter>;

export const MessageReporter = mongoose.model<IMessageReporter>("MessageReporter", schema);
