import { IStorage } from "./IStorage";

export class MemStorage implements IStorage {
  records: Record<string, any> = {};
  createId(): string {
    return Math.random().toString(36).slice(2);
  }
  async getItemAsync(id: string) {
    return this.records[id];
  }
  async setItemAsync(id: string, data: any) {
    this.records[id] = data;
  }
}
