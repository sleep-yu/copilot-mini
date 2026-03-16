import marked, { Tokens } from "marked";

export function extractMarkdownTokens(markdown: string, filter: (token: marked.Token) => boolean) {
  return marked.lexer(markdown).filter(filter);
}

function _convertMarkdownTableToJSON(markdown: string) {
  // 提取所有表格 Token
  const tables = extractMarkdownTokens(markdown, (token) => token.type === "table") as Tokens.Table[];

  // 合并所有表格数据
  const result = [];
  for (const table of tables) {
    for (const row of table.rows) {
      const obj: Record<string, string> = {};
      table.header.forEach((header, index) => {
        obj[header.text] = (row[index] || "").text.trim();
      });
      result.push(obj);
    }
  }

  return result;
}

export function convertMarkdownTableToJSON(markdown: string) {
  const result = _convertMarkdownTableToJSON(markdown);
  if (result.length) {
    return result;
  }
  // 解析table失败，去除多余行再次解析
  const lines = markdown.split("\n");
  const filterLines = lines.filter((line) => /^\s{0,}\|/.test(line));
  return _convertMarkdownTableToJSON(filterLines.join("\n"));
}

export const markdownToText = (text: string) => {
  return (
    text
      // 去除代码块
      .replace(/```[\s\S]*?```/g, "")
      // 去除行内代码
      .replace(/`([^`]+)`/g, "$1")
      // 图片保留链接
      .replace(/!\[.*?\]\((.*?)\)/g, "$1")
      // 去除链接，只保留链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$2")
      // 去除标题
      .replace(/^#{1,6}\s+/gm, "")
      // 去除加粗
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      // 去除斜体
      .replace(/(\*|_)(.*?)\1/g, "$2")
      // 去除无序列表
      .replace(/^\s*[-*+]\s+/gm, "")
      // 去除引用
      .replace(/^\s*>+\s?/gm, "")
      // 去除分割线
      .replace(/^(-{3,}|\*{3,}|_{3,})$/gm, "")
      .trim()
  );
};

export function arrayToMarkdownTable<T>(
  data: T[],
  columns: { [column: string]: keyof T | ((item: T) => string) }
): string {
  // 如果数据为空，返回空字符串
  if (!data || data.length === 0) {
    return "";
  }

  // 获取所有列名
  const headers = Object.keys(columns);

  // 生成表头
  const headerRow = "| " + headers.join(" | ") + " |";

  // 生成分隔行
  const separatorRow = "| " + headers.map(() => "---").join(" | ") + " |";

  // 生成数据行
  const dataRows = data.map((item) => {
    const cells = headers.map((header) => {
      const column = columns[header];
      let value: string;

      // 根据列定义类型获取值
      if (typeof column === "function") {
        value = column(item);
      } else {
        value = String(item[column] ?? "");
      }

      // 处理值中的特殊字符，避免破坏表格格式
      return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
    });

    return "| " + cells.join(" | ") + " |";
  });

  // 组合所有行
  return [headerRow, separatorRow, ...dataRows].join("\n");
}
