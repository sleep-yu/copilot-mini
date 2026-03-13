import { ErrorCode } from '../enums/ErrorCode';

export class HttpError<T = unknown> extends Error {
  public code: number;
  public statusCode: number;
  public data?: T;

  constructor(code: number, message: string, statusCode: number = 200, data?: T) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.data = data;
    this.name = 'HttpError';
  }

  static isHttpError(error: unknown): error is HttpError {
    return error instanceof HttpError;
  }

  static create<T>(code: ErrorCode, message: string, statusCode?: number, data?: T) {
    return new HttpError<T>(code, message, statusCode, data);
  }
}
