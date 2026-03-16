import { AgentHistory } from "@/interface/context";
import { History } from "@/interface/storage";
import mongoose, { Schema } from "mongoose";

export interface IContextValue {
  app?: string;
  sessionId: string;
  slots: Record<string, any>;
  histories: History[];
  agentHistories: AgentHistory[];
  agentMemories: Record<string, any>;
  formName?: string;
  userId?: string;
  dialogueId?: string;
  updatedAt?: Date;
  createdAt?: Date;
}

const schema = new Schema<IContextValue>(
  {
    sessionId: { type: String, required: true, unique: true },
    userId: { type: String },
    app: { type: String },
    slots: Object,
    histories: [Object],
    agentMemories: Object,
    agentHistories: [Object],
    formName: { type: String },
    dialogueId: { type: String },
    question: Object,
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
      },
    },
  }
);

export const ContextValue = mongoose.model<IContextValue>("ContextValue", schema);
