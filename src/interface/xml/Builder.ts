import _ from "lodash";
import { IXmlNode, XMLStyle } from "./node";

/**
 * XML构造器
 */
class Builder {
  /**
   * 将样式对象转换成字符串
   * @param style
   * @returns
   */
  private stringifyStyle(style?: XMLStyle) {
    if (!style) {
      return "";
    }
    return Object.entries(style)
      .map(([key, value]) => {
        return `${_.kebabCase(key)}:${value};`;
      })
      .join("");
  }
  escapeXml(value: string) {
    return _.escape(value);
  }
  /**
   * 将xml属性转换成字符串
   * @param props
   * @returns
   */
  buildProps(props: IXmlNode["props"]) {
    if (!props) {
      return "";
    }
    const propParts: string[] = [];
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined) {
        continue;
      }
      let valueStr = "";
      if (/style$/i.test(key)) {
        valueStr = this.stringifyStyle(value as XMLStyle);
        if (!valueStr) {
          continue;
        }
      } else if (/render$/i.test(key)) {
        valueStr = this.build(value as IXmlNode);
      } else {
        valueStr = typeof value === "object" ? JSON.stringify(value) : String(value);
      }
      propParts.push(`${key}="${this.escapeXml(valueStr)}"`);
    }
    return propParts.join(" ");
  }
  /**
   * 将单个xml节点转换为xml字符串
   * @param node
   * @returns
   */
  private buildNode(node: IXmlNode): string {
    if (node.type === "literal") {
      return this.escapeXml(node.value);
    }
    const children = node.children || [];
    const childrenXml = children.map((child) => this.build(child as IXmlNode)).join("");
    if (node.type === "fragment") {
      return childrenXml;
    }
    let props = this.buildProps(node.props);
    if (props) {
      props = ` ${props}`;
    }
    return `<${node.type}${props}>${childrenXml}</${node.type}>`;
  }
  /**
   * 将xml节点转换为xml字符串
   * @param node
   * @returns
   */
  build(node: IXmlNode | IXmlNode[]): string {
    if (Array.isArray(node)) {
      return node.map((child) => this.build(child as IXmlNode)).join("");
    }
    return this.buildNode(node);
  }
}

export default Builder;
