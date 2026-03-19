import { AgentId } from "@/common/enums";
import { Agent } from "@/interface/agent";
import config from 'config'

const QAAgent = new Agent(AgentId.questionAnswerAgent)

QAAgent.handleFallback(async (context) => {
  // 查询最后一条消息
  const lastMessage = context.lastMessage;
  if (lastMessage.type !== "text") return;
  try {
    const userMessage = lastMessage.content;
    // 调用智谱大模型
    const url = `${config.get('AI_BASE_URL')}/paas/v4/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.get('AI_API_KEY')}`
      },
      body: JSON.stringify({
        model: 'glm-4.7',
        messages: [
          { role: 'user', content: userMessage }
        ]
      })
    })
    const data = await response.json();
    console.log('智谱API返回:', JSON.stringify(data, null, 2));

    // 检查返回数据结构
    if (!data.choices || !data.choices[0]) {
      console.error('API返回数据异常:', data);
      throw new Error('API返回数据格式错误');
    }

    const reply = data.choices[0]?.message?.content || '抱歉，我没有理解您的问题。';

    context.reply({
      type: "text",
      content: reply,
    });
  } catch (error) {
    console.error('调用智谱大模型失败:', error);
    context.reply({
      type: "text",
      content: "抱歉，服务暂时不可用，请稍后再试。",
    });
  }
})

export default QAAgent;