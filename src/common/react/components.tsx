import { Node, Props } from "./type";
import { React } from "./react";
import { IButtonNode, ICollapseNode, IColNode, IFormNode, IImageNode, ILineNode, ILinkNode, IMarkdownNode, IRowNode, ISpinboxNode, ISubmitNode, ITableNode, ITextNode, ITriggerNode, IVideoNode, IViewNode } from "@/interfaces/xml/node";

export function View(props: Props & IViewNode["props"]) {
  return <view {...props}></view>;
}

export function Text(props: Props & ITextNode["props"]) {
  return <text {...props}></text>;
}

export function Image(props: Props & IImageNode["props"]) {
  return <image {...props}></image>;
}

export function Link(props: Props & ILinkNode["props"]) {
  return <link {...props}></link>;
}

export function Button(props: Props & IButtonNode["props"]) {
  return <button {...props}></button>;
}

export function Table(props: Props & ITableNode['props']) {
  return <table {...props}></table>
}

export function Col(props: Props & IColNode['props']) {
  return <col {...props}></col>
}

export function Row(props: Props & IRowNode['props']) {
  // @ts-ignore
  return <row {...props}></row>
}

export function Trigger(props: Props & ITriggerNode["props"]) {
  // @ts-ignore
  return <trigger {...props}></trigger>;
}

export function Collapse(props: Props & ICollapseNode["props"]) {
  // @ts-ignore
  return <collapse {...props}></collapse>;
}
export function Line(props: Props & ILineNode['props']) {
  // @ts-ignore
  return <line {...props}></line>
}
export function Form(props: Props & IFormNode["props"]) {
  // @ts-ignore
  return <form {...props}></form>;
}
export function Spinbox(props: Props & ISpinboxNode["props"]) {
  // @ts-ignore
  return <spinbox {...props}></spinbox>;
}
export function Submit(props: Props & ISubmitNode["props"]) {
  // @ts-ignore
  return <submit {...props}></submit>;
}

export function Markdown(props: Props & IMarkdownNode["props"]) {
  // @ts-ignore
  return <markdown {...props}></markdown>;
}
export function Video(props: Props & IVideoNode["props"]) {
  return <video {...props}></video>;
}
