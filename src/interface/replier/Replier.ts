import type { Context as C } from "../context";
import type { IMessage } from "../messages";

type Context = {
  reply: C["reply"];
};

export abstract class Replier {
  static for<T = Replier>(this: { new (context: Context): T }, context: Context): T {
    return new this(context);
  }

  constructor(protected context: Context) {}

  abstract reply(data: unknown, partials?: Partial<IMessage>): Promise<IMessage>;
}
