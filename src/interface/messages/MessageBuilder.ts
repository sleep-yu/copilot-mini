import { SlotRecords } from "../slots";
import { AdditionalFormat, IBlockMessage, ICommandMessage, IFormMessage, IImageMessage, IMarkdownMessage, IMessage, IRichTextMessage, ISystemMessage, ITextMessage, IVideoMessage, IVoiceMessage } from "./types";
export class MessageBuilder {
  constructor(private _props: Partial<IMessage> = {}) { }

  static with(props: Partial<IMessage> = {}) {
    return new MessageBuilder(props);
  }
  with(props: Partial<IMessage>) {
    return new MessageBuilder({ ...this._props, ...props });
  }

  /**
   * 合并消息属性
   * @param props
   */
  merge(props: Partial<IMessage>) {
    this._props = { ...this._props, ...props };
  }

  get props() {
    return { ...this._props };
  }

  base() {
    return {
      // id: crypto.randomUUID() + `-${Date.now().toString(36)}`,
      createdAt: Date.now(),
    };
  }

  text(text: string, others?: Partial<ITextMessage>): ITextMessage {
    return {
      ...this._props,
      ...others,
      type: "text",
      content: text || "",
      ...this.base(),
    };
  }

  markdown(text: string, others?: Partial<IMarkdownMessage>): IMarkdownMessage {
    return {
      ...this._props,
      ...others,
      type: "markdown",
      content: text || "",
      ...this.base(),
    };
  }

  richtext(text: string, others?: Partial<IRichTextMessage>): IRichTextMessage {
    return {
      ...this._props,
      ...others,
      type: "richtext",
      content: text || "",
      ...this.base(),
    };
  }

  form(formName: string, formData: SlotRecords, others: Partial<IFormMessage>): IFormMessage {
    return {
      ...this._props,
      ...others,
      type: "form",
      formData,
      formName,
      ...this.base(),
    };
  }

  image(imageUrl: string, others?: Partial<IImageMessage>): IImageMessage {
    return {
      ...this._props,
      ...others,
      type: "image",
      imageUrl,
      ...this.base(),
    };
  }

  video(videoUrl: string, others?: Partial<IVideoMessage>): IVideoMessage {
    return {
      ...this._props,
      ...others,
      type: "video",
      videoUrl,
      ...this.base(),
    };
  }

  voice(voiceDuration: string, amrBase64Content: string, others?: Partial<IVoiceMessage>): IVoiceMessage {
    return {
      ...this._props,
      ...others,
      type: "voice",
      voiceDuration,
      amrBase64Content,
      ...this.base(),
    };
  }

  command(command: string, params: any, others?: Partial<ICommandMessage>): ICommandMessage {
    return {
      ...this._props,
      ...others,
      type: "command",
      command,
      params,
      ...this.base(),
    };
  }

  system(text: string, others?: Partial<ISystemMessage>): ISystemMessage {
    return {
      ...this._props,
      ...others,
      type: "system",
      content: text || "",
      ...this.base(),
    };
  }

  block(blocks: AdditionalFormat[], others?: Partial<IMessage>): IBlockMessage {
    return {
      ...this._props,
      ...others,
      type: "block",
      blocks,
      ...this.base(),
    };
  }

  build(others?: Partial<IMessage>): IMessage {
    const message = {
      blocks: [],
      content: "",
      ...this._props,
      ...others,
      ...this.base(),
    };

    if (!message.type) {
      message.type = "block";
    }

    return message as IMessage;
  }
}
