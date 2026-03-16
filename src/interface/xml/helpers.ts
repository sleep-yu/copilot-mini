import { INode, IViewNode, IXmlNode } from "./node";
import { builder, parser } from "./instance";

/**
 * 将抽象语法树构建成xml字符串
 */
export const $stringify = builder.build.bind(builder);

/**
 * 将xml字符串解析成语法树
 */
export const $parse = parser.parse.bind(parser);

/**
 * 构建props字符串
 * @param props
 * @returns
 */
export const $props = <T extends INode = IViewNode>(props: T["props"]) => {
  return builder.buildProps(props);
};

/**
 * 通过字符串及Xml节点构建抽象语法树
 * @param strings
 * @param values
 */
export function $xml(strings: TemplateStringsArray, ...values: (string | IXmlNode | IXmlNode[])[]) {
  const xmls: string[] = [];
  for (let i = 0; i < strings.length; i++) {
    xmls.push(strings[i]);
    if (i < values.length) {
      const value = values[i];
      if (typeof value === "object") {
        xmls.push(builder.build(value as IXmlNode));
      } else {
        xmls.push(String(value));
      }
    }
  }
  const xml = xmls.join("");
  return parser.parse(xml);
}
