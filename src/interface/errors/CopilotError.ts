export interface CopilotErrorOptions {
  [key: string]: any;
}

export class CopilotError extends Error {
  static create(
    code: string,
    message: string,
    options?: CopilotErrorOptions
  ): CopilotError {
    return new CopilotError(code, message, options);
  }
  constructor(
    public code: string,
    message: string,
    public options?: CopilotErrorOptions
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
