import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ResponseFactory } from "./wrapper";
import ErrorCode from "../enums/ErrorCode";
import { HttpError } from "../error";
import logger from "../logger/logger";

export const errorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  logger.warn("API Error:", error.message, error.stack);

  if (error.validation) {
    reply.status(400).send(
      ResponseFactory.error({
        errorCode: ErrorCode.VALIDATION_ERROR,
        data: error.validation?.[0],
        message: "Validation Error",
      })
    );
    return;
  }

  if (HttpError.isHttpError(error)) {
    reply.status(error.httpCode).send(
      ResponseFactory.error({
        errorCode: error.errorCode,
        message: error.message,
        data: error.data,
      })
    );
    return;
  }

  reply.status(500).send(
    ResponseFactory.error({
      errorCode: ErrorCode.SERVER_ERROR,
      message: error.message || "Internal Server Error",
    })
  );
}









