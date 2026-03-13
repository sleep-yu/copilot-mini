/**
 * 提示词模板渲染服务
 * 对应原项目：src/copilot/services/PromptService.ts
 *
 * 原项目继承自 @casstime/copilot-core 的 Service 基类，
 * 使用 llmManager + executePrompt 调用 LLM 做意图分类等任务。
 * mini 版本保留相同的方法签名，LLM 调用部分用规则/占位替代。
 */

import logger from "../../common/logger";

export class PromptService {
  /**
   * 快速解析用户意图
   * 原项目：调用 LLM（精准优化模型）做选项分类，timeout 3s
   * mini 版本：用关键词匹配规则替代
   *
   * @param dialog 当前对话文本
   * @param intents 可选意图列表
   * @returns 匹配到的意图，未匹配时返回 undefined
   */
  async parseUserIntentQuickly(
    dialog: string,
    intents: string[]
  ): Promise<string | undefined> {
    logger.debug(`[PromptService] parseUserIntentQuickly dialog="${dialog}" intents=${JSON.stringify(intents)}`);

    // 原项目：通过 LLM 从 intents 中选择最匹配的
    // mini 版本：返回 undefined，由上层 Agent 的 intentParser 处理
    return undefined;
  }

  /**
   * 渲染提示词模板
   * 原项目：从文件系统加载 .prompt 模板文件并用变量填充
   * mini 版本：直接用字符串模板拼接
   *
   * @param template 模板字符串（支持 {{key}} 占位符）
   * @param variables 变量映射
   */
  renderTemplate(
    template: string,
    variables: Record<string, string>
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return variables[key] ?? `{{${key}}}`;
    });
  }
}
