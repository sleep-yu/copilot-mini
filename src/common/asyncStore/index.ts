import { AsyncLocalStorage } from "node:async_hooks";
import { createObjectId, parseUserAgent, Version } from "../utils";
import { MessageReporter } from "@/messages";
import { IncomingHttpHeaders } from "node:http";
import { VersionEnum } from "../enums";

export type RequestMeta = {
  headers: Record<string, unknown>;
  platform?: string;
  appVersion?: Version;
  replyMsgId?: string;
  requestId?: string;
  messageReporter?: MessageReporter;
};

const asyncLocalStorage = new AsyncLocalStorage<Required<RequestMeta>>();

function createStore(context: RequestMeta): Required<RequestMeta> {
  const { headers } = context;
  const { appVersion, platform } = parseUserAgent((headers as IncomingHttpHeaders)["user-agent"] || "");
  const replyMsgId = createObjectId();

  return {
    ...context,
    appVersion: new Version(appVersion || VersionEnum.MAX_VERSION),
    replyMsgId,
    platform,
    requestId: createObjectId(),
    messageReporter: new MessageReporter(replyMsgId),
  };
}

export const useRequestMeta = () => {
  return asyncLocalStorage.getStore() || createStore({ headers: {} });
};

export const initializeRequestMeta = (context: RequestMeta, next: () => void) => {
  return asyncLocalStorage.run(createStore(context), next);
};
