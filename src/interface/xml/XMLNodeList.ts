import Builder from "./Builder";
import { IXmlNode } from "./node";

export class XMLNodeList extends Array<IXmlNode> {
  constructor(...args: IXmlNode[]) {
    super(...args);
    Object.setPrototypeOf(this, XMLNodeList.prototype);
  }
  toString(): string {
    return new Builder().build(this);
  }
}
