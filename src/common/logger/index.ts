// 简化版 logger，和原项目 @/common/logger 接口一致
const logger = {
  info: (...args: unknown[]) => console.log("[INFO]", ...args),
  warn: (...args: unknown[]) => console.warn("[WARN]", ...args),
  error: (...args: unknown[]) => console.error("[ERROR]", ...args),
  debug: (...args: unknown[]) => console.debug("[DEBUG]", ...args),
};

export default logger;
