import { Types } from "mongoose";
/**
 * mongodb数据库Id 生成器
 * @returns
 */
export function createObjectId() {
  return new Types.ObjectId().toString();
}
