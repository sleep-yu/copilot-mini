export interface ITask<T> {
  id: string;
  params: T;
  status: "pending" | "running" | "completed" | "failed" | "canceled";
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  artifact?: IArtifact<unknown>;
}
export interface IArtifact<T> {
  id: string;
  taskId: string;
  createdAt: Date;
  updatedAt: Date;
  type: string;
  parts: {
    type: string;
    [key: string]: unknown;
  }[];
  result?: T;
}
export declare class Task<T> implements ITask<T> {
  static isTask(data: unknown): data is ITask<unknown>;
  id: string;
  params: T;
  status: "pending" | "running" | "completed" | "failed" | "canceled";
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  artifact: IArtifact<unknown>;
  constructor(params: T);
  updateStatus(status: "pending" | "running" | "completed" | "failed" | "canceled"): void;
  addArtifactPart(part: {
    type: string;
    [key: string]: unknown;
  }): void;
  setArtifactResult<T>(result: T): void;
  getArtifact<T>(): IArtifact<T>;
}
