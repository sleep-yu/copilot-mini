import mongoose, { Schema, Document } from "mongoose";

export type IDialogue = {
  app: string;
  name: string;
  userId: string;
  companyId: string;
  businessId?: string;
};

const schema = new Schema<IDialogue>(
  {
    app: { type: String, required: true },
    name: { type: String, required: true },
    userId: { type: String, required: true },
    companyId: { type: String, required: true },
    businessId: { type: String, default: "DEFAULT" },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id;
      },
    },
  }
);

export type DialogueDoc = Document<IDialogue>;

export const Dialogue = mongoose.model<IDialogue>("Dialogue", schema);
