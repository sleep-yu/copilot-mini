/**
 * 等待一段时间，setTimeout Promise 封装，值小于等于 0 毫秒时，使用 queueMicrotask
 * @param ms
 * @returns
 */
export const sleep = (ms: number) => {
  if (ms <= 0) {
    return new Promise<void>((resolve) => queueMicrotask(resolve));
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
};