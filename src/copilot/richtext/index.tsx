import { React, renderToXML } from "@/common/react/react";

/**
 * 渲染富文本
 * @param Comp - React组件
 * @param props - 组件属性
 * @returns XML字符串
 */
export function renderRichtext<T extends object>(Comp: (props: T) => React.JSX.Element, props: T): string {
  return renderToXML(<Comp {...props} />);
}
