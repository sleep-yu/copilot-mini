import config from "config";
import logger from "../logger/logger";

/** 先从环境变量取，没有从config取 */
export const getEnvConfig = (name: string) => {
  return process.env[name] || config.get(name) || config.util.getEnv(name);
};

/** 是否本地调试环境 */
export const isDev = () => {
  return config.util.getEnv("NODE_ENV") === "development";
};

export const getApolloConfig = <T = unknown>(key: string): T | undefined => {
  try {
    return config.get(key);
  } catch {
    logger.warn(`获取apollo配置失败，key： ${key}`);
    return undefined;
  }
};
