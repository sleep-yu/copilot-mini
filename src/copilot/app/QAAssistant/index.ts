import { Application } from "@/interface/app";
import { AppId } from "@/common/enums";
import QAAgent from "./agent";

const app = new Application(AppId.Question_Answer);
app.setClassifier({
  id: 'QAAgent',
  classify: async () => {
    return QAAgent.agentId
  }
})

app.registerAgent(QAAgent);

export default app;