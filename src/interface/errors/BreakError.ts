export class BreakError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BreakError";
    Error.captureStackTrace(this, this.constructor);
  }
}
