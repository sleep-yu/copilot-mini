import mongoose, { Schema, Document } from "mongoose";

export type IRequestStatus = {
  requestId: string;
  done: boolean;
  updatedAt?: Date;
  createdAt?: Date;
};

const schema = new Schema<IRequestStatus>(
  {
    done: { type: Boolean, default: false },
    requestId: { type: String, required: true },
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

export type RequestStatusDoc = Document<IRequestStatus>;

export const RequestStatus = mongoose.model<IRequestStatus>("RequestStatus", schema);
