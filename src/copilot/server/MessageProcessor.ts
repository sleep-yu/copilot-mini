import { VersionEnum } from "@/common/enums";
import { Version } from "@/common/utils";
import { renderRichtext } from "../richtext";
import { Markdown } from "@/common/react/components";
import { IBlockMessage, IMessage } from "@/interface/messages";

interface IMessageProcessOptions {
  appVersion: Version;
  containerId: string;
}

/**
 * 用于处理消息的兼容性问题
 */
class MessageProcessor {
  private appVersion: Version;
  private containerId: string;
  constructor(options: IMessageProcessOptions) {
    this.appVersion = options.appVersion;
    this.containerId = options.containerId;
  }

  markdownToText(text: string) {
    return text
      .replace(/^#{1,6}\s+/gm, "") // 去掉标题
      .replace(/(\*\*|__)(.*?)\1/g, "$2") // 去掉加粗
      .replace(/(\*|_)(.*?)\1/g, "$2") // 去掉斜体
      .replace(/-\s*/g, ""); // 去掉列表
  }

  /**
   * 兼容处理block消息
   * @param message
   * @returns
   */
  processBlockMessage(message: IBlockMessage): IMessage[] {
    // 支持block消息的版本返回原始消息
    if (!this.appVersion.isLessThan(VersionEnum.BLOCK_MESSAGE_SUPPORT)) {
      return [message];
    }

    const blocks = Array.isArray(message.blocks) ? message.blocks : [];
    const baseMessage = { ...message, blocks: undefined };
    if (blocks.some((b) => b.type === "richtext")) {
      const richtext = blocks
        .map((block) => {
          if (block.type === "richtext") {
            return block.content;
          }
          return renderRichtext(Markdown, { text: block.content });
        })
        .join("\n");
      return [
        {
          ...baseMessage,
          type: "richtext" as const,
          content: richtext,
        },
      ];
    }

    const markdown = blocks.map((b) => b.content).join("\n\n");
    return [
      {
        ...baseMessage,
        type: "markdown" as const,
        content: markdown,
      },
    ];
  }

  process(message: IMessage): IMessage[] {
    if (message.type === "block") {
      return this.processBlockMessage(message);
    }

    return [message];
  }
}

export default MessageProcessor;
