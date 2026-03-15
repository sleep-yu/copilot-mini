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
  let newPaylod = payload;
  if (payload instanceof ResponseWrapper) {
    newPaylod = payload.response;
  } else {
    newPaylod = ResponseFactory.success(payload).response;
  }
  done(err, newPaylod);
};
