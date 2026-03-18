import { AgentId } from "@/common/enums";
import { Agent } from "@/interface/agent";

const QAAgent = new Agent(AgentId.questionAnswerAgent, '问答助手')

export default QAAgent;