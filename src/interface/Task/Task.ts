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
  parts: { type: string;[key: string]: unknown }[];
  result?: T;
}

export class Task<T> implements ITask<T> {
  static isTask(data: unknown): data is ITask<unknown> {
    return data instanceof Task;
  }
  id: string;
  params: T;
  status: "pending" | "running" | "completed" | "failed" | "canceled";
  parentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  artifact: IArtifact<unknown>;

  constructor(params: T) {
    this.id = crypto.randomUUID();
    this.params = params;
    this.status = "pending";
    this.parentId = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.artifact = {
      id: crypto.randomUUID(),
      taskId: this.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      type: "default",
      parts: [],
    };
  }

  updateStatus(status: "pending" | "running" | "completed" | "failed" | "canceled") {
    this.status = status;
    this.updatedAt = new Date();
  }

  addArtifactPart(part: { type: string;[key: string]: unknown }) {
    this.artifact.parts.push(part);
    this.artifact.updatedAt = new Date();
  }

  setArtifactResult<T>(result: T) {
    this.artifact.result = result;
    this.artifact.updatedAt = new Date();
  }

  getArtifact<T>(): IArtifact<T> {
    return this.artifact as IArtifact<T>;
  }
}
