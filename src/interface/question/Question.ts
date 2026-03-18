import { Context } from "../context";
import { IMessage } from "../messages";


export interface IQuestion {
  type: string;
  params: any;
}


export class Question<T = any> {
  config: T;
  constructor(config: T) {
    this.config = config;
  }
  /**
   * 发送该问题给用户
   * @param context
   */
  sendTo(context: Context) {
    throw new Error("Not implement yet~");
  }

  /**
   * 解析返回的Answer，true 表示成功，false 表示失败
   * @param msg
   * @param context
   */
  parseAnswer(msg: IMessage, context: Context): Promise<boolean> | boolean {
    throw new Error("Not implement yet~");
  }
}
