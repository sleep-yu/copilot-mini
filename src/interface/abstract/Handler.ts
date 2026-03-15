import type { Agent } from "../agent";
import type { Context } from "../context";
import { Task } from "../Task";
export declare abstract class Handler {
  protected context: Context;
  protected agent: Agent;
  constructor(context: Context, agent: Agent);
  abstract handle(): Promise<void>;
}
export declare abstract class TaskHandler<T> extends Handler {
  task: Task<T>;
  constructor(context: Context, task: Task<T>, agent: Agent);
}
