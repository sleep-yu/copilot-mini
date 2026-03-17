import { IdCreator } from "@/interface/abstract";
import { IStorage } from "@/interface/storage";


export interface CopilotConfig extends IdCreator {
  storage?: IStorage;
}

export class Copilot {

}