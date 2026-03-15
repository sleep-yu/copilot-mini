import config from "config";

/** 先从环境变量取，没有从config取 */
export const getEnvConfig = (name: string) => {
  return process.env[name] || config.get(name) || config.util.getEnv(name);
};