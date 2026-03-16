import { useRequestMeta } from "@/common/asyncStore";
import { VersionEnum } from "@/common/enums";
import { Image, Link, Text, Markdown as MD, View } from "@/common/react/components";
import { React } from "@/common/react/react";
import { markdownToText } from "@/common/utils/markdown";
import { marked, Token } from "marked";

export interface MarkdownProps {
  text: string;
}

function renderToken(token: Token) {
  switch (token.type) {
    case "paragraph":
      return <View>{token.tokens?.map((token) => renderToken(token))}</View>;
    case "text":
      return <Text style={{ fontSize: 32 }}>{token.text}</Text>;
    case "heading":
      return <Text style={{ fontSize: (6 - token.depth) * 2 + 32, fontWeight: "bold" }}>{token.text}</Text>;
    case "code":
      return <Text style={{ whiteSpace: "pre-wrap" }}>{token.text}</Text>;
    case "blockquote":
      return <View>{token.tokens?.map((token) => renderToken(token))}</View>;
    case "list":
      return <Text style={{ fontSize: 32, whiteSpace: "pre-wrap" }}>{token.raw}</Text>;
    case "list_item":
      return <Text style={{ fontSize: 32 }}>{token.text}</Text>;
    case "image":
      return <Image uri={token.href} />;
    case "link":
      return <Link to={token.href}>{token.text}</Link>;
    default:
      return <Text style={{ fontSize: 32, whiteSpace: "pre-wrap" }}>{markdownToText(token.raw)}</Text>;
  }
}

/**
 * 将Markdown文本转换为richtext
 */
export function Markdown({ text }: MarkdownProps) {
  const { appVersion } = useRequestMeta();
  // App新版本使用内置的Markdown组件
  const useNewMDRender =
    appVersion &&
    !appVersion.isLessThan(VersionEnum.XML_MARKDOWN_SUPPORT) &&
    appVersion.isLessThan(VersionEnum.MAX_VERSION);
  if (useNewMDRender) {
    return <MD>{text}</MD>;
  }
  const tokens = marked.lexer(text);
  return <>{tokens.map((token) => renderToken(token))}</>;
}
