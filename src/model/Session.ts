import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  timestamp: number;
}

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    thinking: { type: String, required: false },
    timestamp: { type: Number, required: true },
  },
  { _id: false }
);

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

SessionSchema.index({ userId: 1, createdAt: -1 });

export const Session = mongoose.model<ISession>("Session", SessionSchema);
