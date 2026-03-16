import _ from "lodash";
import { Element, Props, Node } from "./type";
import { IXmlNode } from "@/interface/xml/node";
import { $stringify } from "@/interface/xml/helpers";
function createTextElement(text: string) {
  return {
    type: "TEXT_ELEMENT",
    __element: true,
    props: {
      nodeValue: `${text}`,
      children: [],
    },
  } as Element;
}

const DO_NOT_RENDER_CHILD = [null, undefined, true, false];

export function createElement(type: string | undefined, props: Props = {}, ...children: Node[]): Element {
  let child = props?.children;
  if (!children.length && child) {
    children = [child as Element];
  }
  const childrenElements = children
    .filter((child) => !DO_NOT_RENDER_CHILD.includes(child as any))
    .map((child) => {
      if (!["function", "object"].includes(typeof child)) {
        return createTextElement(child as string);
      }
      if (Array.isArray(child)) {
        return {
          type: "fragment",
          __element: true,
          props: {
            children: child,
          },
        } as Element;
      }
      if (!_.get(child, "__element")) {
        return createTextElement(child.toString());
      }
      return child;
    });

  return {
    type: type || "fragment",
    __element: true,
    props: {
      ...props,
      children: childrenElements.length > 1 ? childrenElements : childrenElements[0],
    },
  } as Element;
}

function toXMLNode(ele: Element): IXmlNode {
  if (ele.type === "TEXT_ELEMENT") {
    let value = ele.props.nodeValue || "";

    return {
      type: "literal",
      value,
    };
  }

  let xmlNode: IXmlNode;
  if (typeof ele.type === "function") {
    const vNode = ele.type(ele.props);
    xmlNode = toXMLNode(vNode);
  } else {
    const props = { ...ele.props };
    for (const key in props) {
      if (_.get(props[key], "__element")) {
        props[key] = toXMLNode(props[key] as Element);
      }
    }
    xmlNode = {
      type: ele.type,
      props: { ...props, children: undefined },
      children: [],
    } as IXmlNode;
    // console.log("-->", JSON.stringify(ele, null, 2), JSON.stringify(xmlNode, null, 2));
    let children = ele.props.children;
    if (children) {
      xmlNode.children = Array.isArray(children)
        ? children.map((child) => toXMLNode(child as Element))
        : [toXMLNode(children as Element)];
    }
  }
  return xmlNode;
}

export function renderToXML(node: Element): string {
  const ast = toXMLNode(node);
  // console.log("--->", JSON.stringify(node, null, 2), JSON.stringify(ast, null, 2));
  return $stringify(ast);
}

export const React = { createElement };
