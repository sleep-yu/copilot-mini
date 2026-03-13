import { ErrorCode } from '../enums/ErrorCode';
import { HttpError } from './HttpError';

const ERROR_MESSAGES: Record<number, string> = {
  [ErrorCode.PARAM_ERROR]: '参数错误',
  [ErrorCode.VALIDATION_ERROR]: '参数校验失败',
  [ErrorCode.SERVICE_ERROR]: '服务错误',
  [ErrorCode.SERVER_ERROR]: '服务器异常',
};

export class ErrorFactory {
  static create(code: ErrorCode, message?: string): HttpError {
    return new HttpError(code, message ?? ERROR_MESSAGES[code] ?? '未知错误');
  }
}
