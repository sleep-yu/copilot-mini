import { Code, IClassifier } from "../classifier";
import type { Context } from "../context";
import { buildCommandIntent as buildCommandIntent } from "../helpers/utils";

export class IntentParser {
  constructor(private mainClassifier: IClassifier, private preClassifiers?: Record<string | symbol, IClassifier>) { }

  /**
   * 意图解析，返回对应code
   * @param context
   * @param categories
   * @returns
   */
  async parse(context: Context, categories: Code[]) {
    const lastMessage = context.lastMessage;
    // 如果是命令，直接返回命令意图
    if (lastMessage.type === "command") {
      return buildCommandIntent(lastMessage.command);
    }

    // 如果有前置分类器，先走前置分类器
    const preClassifierConfig = context.takePreClassifierConfig();

    // 如果消息带NLU，直接返回特定意图
    const specialIntent = lastMessage.nlu?.intent;
    if (specialIntent) {
      return specialIntent;
    }

    if (preClassifierConfig) {
      const { id, params } = preClassifierConfig;
      const preClassifier = this.preClassifiers?.[id];
      if (preClassifier) {
        const code = await preClassifier.classify(context, (params as any)?.categories || []);
        if (typeof code === "string") {
          return code;
        }
      }
    }
    // 如果前置分类没有命中，走主分类器
    const item = await this.mainClassifier.classify(context, categories);
    return item;
  }
}
