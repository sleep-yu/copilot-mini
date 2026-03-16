import { Entity } from "../entity";
import type { SlotRecords } from "../slots";
import { ReplyMode } from "../IServer";

interface IAdditionalFormatBase<T> {
  id?: string;
  type: string;
  content: T;
  hidden?: boolean;
  /**
   * 扩展字段
   */
  extra?: Record<string, any>;
}
export interface IRichTextFormat extends IAdditionalFormatBase<string> {
  type: "richtext";
}
export interface ITextFormat extends IAdditionalFormatBase<string> {
  type: "text";
}
export interface IMarkdownFormat extends IAdditionalFormatBase<string> {
  type: "markdown";
}
export interface IOtherFormat extends IAdditionalFormatBase<any> {
  type: string;
}
export type AdditionalFormat = IRichTextFormat | ITextFormat | IMarkdownFormat | IOtherFormat;
export interface INLU {
  /**
   * @deprecated 请使用 agentId
   */
  agentName?: string;
  agentId?: string;
  intent?: string | symbol;
  entities?: Entity[];
  slots?: SlotRecords;
}
interface IActionBase {
  text: string;
  type: "nlu" | "command";
  iconUrl?: string;
  theme?: "primary" | "secondary";
}
export interface INluAction extends IActionBase {
  type: "nlu";
  nlu?: INLU;
  displayText?: string;
}
export interface ICommandAction extends IActionBase {
  type: "command";
  command: string;
  params?: any;
}
export type IAction = INluAction | ICommandAction;
export interface IMessageBase {
  /**
   * 消息关联的请求id,一个requestId对应多条消息
   */
  requestId?: string;
  /**
   * 会话id
   */
  sessionId?: string;
  /**
   * 消息id,唯一标识，对应mongodb中的_id
   */
  id?: string;
  /**
   * 消息类型
   */
  type: string;
  /**
   * 消息自带nlu，如果带nlu，这条消息直接将nlu赋值给context，不会经过NLU中间件处理
   */
  nlu?: INLU;
  /**
   * 快捷操作，置于消息下方
   */
  actions?: IAction[][];
  /**
   * 消息指示器
   */
  indicator?: AdditionalFormat;
  /**
   * 消息嵌入内容
   */
  embed?: AdditionalFormat;
  /**
   * 消息提示
   */
  tips?: AdditionalFormat;
  /**
   * 免责声明
   */
  disclaimer?: string;
  /**
   * 扩展字段
   */
  extra?: Record<string, any>;
  /**
   * 发送方
   */
  fromUser?: string;
  /**
   * 消息是哪个agent发出的
   */
  agent?: string;
  /**
   * 消息是哪个app发出的
   */
  app?: string;
  /**
   * 接收方
   */
  toUser?: string;
  /**
   * 前端受到带reply属性消息时，自动回复该消息
   */
  reply?: IMessage;
  /**
   * 延时回复，单位ms
   */
  replyDelay?: number;
  /**
   * 消息创建时间
   */
  createdAt?: number;
  /**
   * 属于谁的消息
   * 标记消息："userId:OrgId"
   */
  owner?: string;
  /**
   * 是否是后台消息
   */
  background?: boolean;
  /**
   * 发送的消息是否需要持久化，这个字段不入库
   */
  persistent?: boolean;
  /**
   * 对话id
   */
  dialogueId?: string;
  /**
   * 输入框默认值
   */
  placeholder?: string;
  /**
   * 元数据
   */
  metadata?: Record<string, any>;
}
export interface IMultTextMessage {
  type: "text" | "markdown" | "richtext";
  content: string;
}
export interface ICommandMessage extends IMessageBase {
  type: "command";
  command: string;
  params: any;
}
export interface IFormMessage extends IMessageBase {
  type: "form";
  formData: SlotRecords;
  formName: string;
  status?: string;
  title?: string;
}
export interface IImageMessage extends IMessageBase {
  type: "image";
  imageUrl: string;
}
export interface IVideoMessage extends IMessageBase {
  type: "video";
  videoUrl: string;
  thumb?: string;
  duration?: string;
}
export interface IVoiceMessage extends IMessageBase {
  type: "voice";
  content?: string;
  voiceDuration: string;
  amrBase64Content: string;
}
export interface ITextMessage extends IMessageBase {
  type: "text";
  content: string;
}
export interface IMarkdownMessage extends IMessageBase {
  type: "markdown";
  content: string;
}
export interface IRichTextMessage extends IMessageBase {
  type: "richtext";
  content: string;
}
export interface ISystemMessage extends IMessageBase {
  type: "system";
  content: string;
}
export interface IRecordMessage extends IMessageBase {
  type: "record";
  text: string;
  intent?: string;
  command?: string;
  action?: IAction;
}
export interface IBlockMessage extends IMessageBase {
  type: "block";
  blocks: AdditionalFormat[];
}
export type IMessage = IImageMessage | IVideoMessage | IVoiceMessage | ICommandMessage | ITextMessage | IMarkdownMessage | IRichTextMessage | IFormMessage | ISystemMessage | IRecordMessage | IBlockMessage;
export { };


export interface IPayload {
  sessionId?: string;
  app: string;
  data: IMessage;
  [extra: string]: any;
}

export interface ISocket {
  id: string;
  send(message: IMessage): void;
  end(): void;
  setReplyMode(replyMode: ReplyMode): void;
}