import type { CSSProperties } from "react";
import { IAction } from "./action";
import { Node } from "../../common/react/type";

export type XMLStyle = CSSProperties & { tintColor?: string };

export interface INode {
  type: string;
  props?: { [key: string]: unknown };
  value?: string;
  children?: INode[];
}

/**
 * 常量节点
 */
export interface ILiteralNode extends INode {
  type: "literal";
  value: string;
  children?: never;
}

/**
 * 可交互的行内节点
 */
type InteractiveInlineNode = ILinkNode | IButtonNode;
/**
 * 不可交互的行内节点
 */
type NonInteractiveInlineNode = ILiteralNode | ITextNode | IImageNode | ITableNode | IColNode | IRowNode | IMarkdownNode | IVideoNode;
/**
 * 行内节点
 */
type InlineNode = InteractiveInlineNode | NonInteractiveInlineNode;

/**
 * 图片节点
 */
export interface IImageNode extends INode {
  type: "image";
  props: {
    uri: string;
    style?: XMLStyle;
  };
  children?: never;
}

/**
 * 文本节点
 */
export interface ITextNode extends INode {
  type: "text";
  props?: {
    style?: XMLStyle;
    /**
     * 最大行数
     */
    numberOfLines?: number;
    /**
     * 是否可选择文本
     */
    selectable?: boolean;
  };
  children: InlineNode[];
}

/**
 * 按钮节点
 */
export interface IButtonNode extends INode {
  type: "button";
  props?: {
    style?: XMLStyle;
    action?: IAction;
    [key: string]: unknown;
  };
  children: NonInteractiveInlineNode[];
}

/**
 * View节点
 */
export interface IViewNode extends INode {
  type: "view";
  props?: {
    style?: XMLStyle;
    action?: IAction;
  };
  children?: IXmlNode[];
}

/**
 * Link 节点
 */
export interface ILinkNode extends INode {
  type: "link";
  props?: {
    style?: XMLStyle;
    to: string;
  };
  children: NonInteractiveInlineNode[];
}

/** Table节点 */
export interface ITableNode extends INode {
  type: "table";
  props?: {
    style?: XMLStyle;
    colFreeze?: number; // 冻结第几列
    rowFreeze?: number; // 冻结第几行
  };
  children: IXmlNode[];
}
/** Col节点 */
export interface IColNode extends INode {
  type: "col";
  props?: {
    style?: XMLStyle;
  };
  children: IXmlNode[];
}
/** Row节点 */
export interface IRowNode extends INode {
  type: "row";
  props?: {
    style?: XMLStyle;
  };
  children: IXmlNode[];
}

/** Collapse节点 */
export interface ITriggerNode extends INode {
  type: "trigger";
  props: {
    style?: XMLStyle;
    for: string;
    displayWhen: string;
    hidden: string;
  };
  children: IXmlNode[];
}
export interface ICollapseNode extends INode {
  type: "collapse";
  props: {
    style?: XMLStyle;
    id: string;
    placeholderRender: Node;
    defaultState: string;
  };
  children: IXmlNode[];
}

export interface IFragment extends INode {
  type: "fragment";
  children: IXmlNode[];
}

export interface ILineNode extends INode {
  type: "line";
  props?: {
    style?: XMLStyle;
    xStart: number;
    yStart: number;
    xEnd: number;
    yEnd: number;
    strokeColor?: string; // 线条颜色
    strokeWidth?: number; // 线条宽度
  };
  children: IXmlNode[];
}

export interface IFormNode extends INode {
  type: "form";
  props?: {
    style?: XMLStyle;
    action: IAction;
  };
  children: IXmlNode[];
}

export interface ISpinboxNode extends INode {
  type: "spinbox";
  props?: {
    style?: XMLStyle;
    name: string;
    min?: string;
    max?: string;
    errMsg?: string;
    inputStyle?: string;
  };
  children: IXmlNode[];
}

export interface ISubmitNode extends INode {
  type: "submit";
  props?: {
    style?: XMLStyle;
    textStyle?: XMLStyle;
  };
  children: IXmlNode[];
}

/**
 * markdown节点
 */
export interface IMarkdownNode extends INode {
  type: "markdown";
  props?: {}
  children: InlineNode[];
}
/**
 * video节点
 */
export interface IVideoNode extends INode {
  type: "video";
  props?: {
    uri: string;
    thumbUrl?: string;
    style?: XMLStyle;
  }
  children: never;
}


export type IXmlNode = InlineNode | IViewNode | IFragment | ITableNode | IColNode | IRowNode | ITriggerNode | ICollapseNode | ILineNode | IFormNode | ISpinboxNode | ISubmitNode;
