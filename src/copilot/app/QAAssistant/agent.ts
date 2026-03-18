import { AgentId } from "@/common/enums";
import { Agent } from "@/interface/agent";

const QAAgent = new Agent(AgentId.questionAnswerAgent)
console.log(QAAgent.agentId, QAAgent.agentName);

export default QAAgent;