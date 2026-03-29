import config from 'config'

const AI_MODEL = config.get('AI_MODEL') as string || 'glm-4.7';

export interface AskOptions {
  userId: string;
  message: string;
}

export interface AskResult {
  ok: boolean;
  content?: string;
  error?: string;
}

export const aiService = {
  /**
   * 调用智谱大模型生成回复
   */
  async ask({ userId, message }: AskOptions): Promise<AskResult> {
    // 运行时读取，确保 dotenv 已加载
    const AI_BASE_URL = process.env.AI_BASE_URL || config.get('AI_BASE_URL') as string;
    const AI_API_KEY = process.env.AI_API_KEY || config.get('AI_API_KEY') as string;

    try {
      const url = `${AI_BASE_URL}/paas/v4/chat/completions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            { role: 'user', content: message }
          ]
        })
      });

      if (!response.ok) {
        console.error('智谱 API HTTP 错误:', response.status, response.statusText);
        return { ok: false, error: `AI 服务 HTTP 错误: ${response.status}` };
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0]) {
        console.error('智谱 API 返回数据异常:', JSON.stringify(data, null, 2));
        return { ok: false, error: 'AI 返回数据格式错误' };
      }

      const content = data.choices[0]?.message?.content || '抱歉，我没有理解您的问题。';
      return { ok: true, content };
    } catch (error) {
      console.error('调用智谱大模型失败:', error);
      return { ok: false, error: '抱歉，服务暂时不可用，请稍后再试。' };
    }
  },

  /**
   * 流式调用智谱大模型，逐 chunk yield 增量内容
   */
  async *askStream({ message }: { userId: string; message: string }): AsyncGenerator<string> {
    const AI_BASE_URL = process.env.AI_BASE_URL || config.get('AI_BASE_URL') as string;
    const AI_API_KEY = process.env.AI_API_KEY || config.get('AI_API_KEY') as string;

    const response = await fetch(`${AI_BASE_URL}/paas/v4/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        stream: true,
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI 服务 HTTP 错误: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 按 SSE 行分割
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // 解析失败跳过
        }
      }
    }
  },

  /**
   * 调用 copilot-hook（如果将来需要走原有协议）
   */
  async callCopilotHook(params: {
    app: string;
    fromUser: string;
    content: string;
    type?: string;
    sessionId?: string;
  }): Promise<AskResult> {
    try {
      const response = await fetch('http://localhost:62345/copilot/hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app: params.app || 'QUESTION_ANSWER',
          data: {
            fromUser: params.fromUser,
            type: params.type || 'text',
            content: params.content,
          },
          sessionId: params.sessionId,
        })
      });
      const result = await response.json();

      if (!result.data?.messages || result.data.messages.length === 0) {
        return { ok: false, error: 'AI 服务暂时不可用' };
      }

      const aiMessage = result.data.messages.find((m: any) => m.fromUser === 'system');
      return { ok: true, content: aiMessage?.content || '抱歉，我没有理解您的问题。' };
    } catch (error) {
      console.error('调用 Copilot Hook 失败:', error);
      return { ok: false, error: '抱歉，服务暂时不可用，请稍后再试。' };
    }
  }
};
