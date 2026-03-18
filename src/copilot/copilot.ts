import { Copilot } from "@/class/copilot";
import { storage } from "./storage";
import { createObjectId } from "@/common/utils";
import { QuestionAnswerApp } from './app'

const copilot = new Copilot({ storage, createId: createObjectId });

copilot.registerApplication(QuestionAnswerApp);

export default copilot;