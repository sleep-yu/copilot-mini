import { AppId } from "@/common/enums";
import { Application } from "@/interface/app";

const app = new Application(AppId.Question_Answer);

app.setClassifier({
  id: 'FAQClassifier',
  classify: async () => {

  }
})