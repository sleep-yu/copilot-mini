import { IMessage } from "@/interface/messages";
import mongoose, { Schema, Document } from "mongoose";

export type ICopilotMessage = IMessage & { sessionId: string; updatedAt?: Date };

const schema = new Schema<ICopilotMessage>(
  {
    type: { type: String, required: true },
    createdAt: Date,
    nlu: Object,
    fromUser: String,
    toUser: String,
    imageUrl: String,
    videoUrl: String,
    thumb: String,
    duration: String,
    voiceDuration: String,
    amrBase64Content: String,
    status: Object,
    content: String,
    sessionId: { type: String, required: true },
    command: String,
    params: Object,
    title: String,
    extra: Object,
    reply: Object,
    actions: [Object],
    formData: Object,
    formName: String,
    owner: String,
    agent: String,
    app: String,
    requestId: String,
    disclaimer: String,
    indicator: Object,
    embed: Object,
    tips: Object,
    background: Boolean,
    replyDelay: Number,
    text: String,
    intent: String,
    action: Object,
    dialogueId: String,
    placeholder: String,
    blocks: [Object],
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret: any) {
        ret.id = ret._id;
      },
    },
  }
);

export type CopilotMessageDoc = ICopilotMessage & Document;

export const CopilotMessage = mongoose.model<ICopilotMessage>("CopilotMessage", schema);
