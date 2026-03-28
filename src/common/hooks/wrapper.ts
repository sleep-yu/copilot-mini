import { FastifyReply, FastifyRequest } from "fastify";
import ErrorCode from "../enums/ErrorCode";

export class ResponseWrapper {
  public response: any;
  constructor(data: any, extra?: any) {
    this.response = {
      errorCode: ErrorCode.SUCCESS,
      data: data,
      ...extra,
    };
  }
}

export class ResponseFactory {
  static success(data: any, extra?: any) {
    return new ResponseWrapper(data, extra);
  }
  static error(data: any) {
    return new ResponseWrapper(null, data);
  }
}

export const wrapperHandler = (request: FastifyRequest, reply: FastifyReply, payload: any, done: any) => {
  const err = null;
  // 4xx/5xx 响应已由 fail/errorHandler 直接设置 errorCode，不再包装
  const statusCode = reply.statusCode;
  if (statusCode >= 400) {
    done(err, payload);
    return;
  }
  let newPaylod = payload;
  if (payload instanceof ResponseWrapper) {
    newPaylod = payload.response;
  } else {
    newPaylod = ResponseFactory.success(payload).response;
  }
  done(err, newPaylod);
};
