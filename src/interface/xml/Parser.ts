import { XMLParser } from "fast-xml-parser";
import { IXmlNode } from "./node";
import { XMLNodeList } from "./XMLNodeList";
import _ from "lodash";

/**
 * XML解析器
 */
class Parser {
  private fastParser = new XMLParser({ preserveOrder: true, ignoreAttributes: false, removeNSPrefix: false });
  /**
   * 将样式字符串转换为对象
   * @param style example: "color: red; font-size: 12px;"
   * @returns
   */
  transformStyleToObject(style: string) {
    if (!style) {
      return undefined;
    }
    const result: Record<string, any> = {};
    const styles = style.split(";");
    for (const style of styles) {
      if (!style?.trim()) {
        continue;
      }
      const [key, value] = style.split(":");
      const styleKey = _.camelCase(key.trim());
      const styleValue = value.trim();
      result[styleKey] = styleValue;
    }
    return result;
  }

  /**
   * 尝试解析json，如果解析失败，则返回原始值
   * @param value
   * @returns
   */
  tryParseJson(value: string) {
    const escaped = _.unescape(value);
    try {
      return JSON.parse(escaped);
    } catch (err) {
      return escaped;
    }
  }

  transformProps(props: any): any {
    if (!props) {
      return {};
    }

    const result: Record<string, any> = {};
    for (const key in props) {
      const value = props[key];
      const rawKey = key.replace(/^@_/, "");
      if (/style$/i.test(rawKey)) {
        result[rawKey] = this.transformStyleToObject(value);
      } else if (/render$/i.test(rawKey)) {
        result[rawKey] = this.parse(_.unescape(value))[0];
      } else {
        result[rawKey] = this.tryParseJson(value);
      }
    }
    return result;
  }
  /**
   * 将fast-xml-parser解析出的xml对象转换为自定义的xml节点对象
   * @param node
   * @returns
   */
  transformXmlNode(node: any): IXmlNode {
    const type = Object.keys(node)[0];
    if (type === "#text") {
      return {
        type: "literal",
        value: _.unescape(String(node[type])),
      };
    }
    const PROPS_KEY = ":@";

    const props = this.transformProps(node[PROPS_KEY]);
    const children = node[type].map((child: any) => this.transformXmlNode(child));
    return {
      props,
      type: type,
      children,
    } as IXmlNode;
  }
  /**
   * 解析XML节点
   * @param xml
   * @returns
   */
  parse(xml: string): XMLNodeList {
    const object = this.fastParser.parse(xml) as any[];
    // 没解析出节点，直接返回文本节点
    if (xml && !object.length) {
      return new XMLNodeList({
        type: "literal",
        value: xml,
      });
    }
    return new XMLNodeList(...object.map((node) => this.transformXmlNode(node)));
  }
}

export default Parser;
