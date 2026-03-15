import type { Context as C } from "../context";
import type { IMessage } from "../messages";
type Context = {
  reply: C["reply"];
};
export declare abstract class Replier {
  protected context: Context;
  static for<T = Replier>(this: {
    new(context: Context): T;
  }, context: Context): T;
  constructor(context: Context);
  abstract reply(data: unknown, partials?: Partial<IMessage>): Promise<IMessage>;
}
export { };
