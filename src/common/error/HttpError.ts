import ErrorCode from "../enums/ErrorCode";

interface HttpErrorOptions<T> {
  errorCode?: number;
  message?: string;
  httpCode?: number;
  data?: T;
}

export class HttpError<T = unknown> extends Error {
  public errorCode: number;
  public httpCode: number;
  public message: string;
  public data?: T;

  static isHttpError(error: unknown): error is HttpError {
    return error instanceof HttpError;
  }

  static create<T>(errorCode: ErrorCode, options: Omit<HttpErrorOptions<T>, "message"> = {}) {
    return new HttpError<T>({
      ...options,
      errorCode,
    });
  }

  constructor({ errorCode, message, httpCode, data }: HttpErrorOptions<T>) {
    super(message);
    this.message = message || "";
    this.errorCode = errorCode || ErrorCode.SERVER_ERROR;
    this.httpCode = httpCode || 200;
    this.data = data;
  }
}