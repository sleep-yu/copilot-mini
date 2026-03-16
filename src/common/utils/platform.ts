/**
 * 通过UserAgent解析平台信息
 * @param userAgent
 * @returns
 */
export const parseUserAgent = (userAgent: string) => {
  const [app = "", system = "", ...rest] = userAgent.split(" ");
  const [containerId = "", appVersion = ""] = app.split("/");
  const [platform = "", systemVersion = ""] = system.split("/");
  const [phoneBrand = "", phoneSeries = ""] = rest.join(" ").split("/");
  const [first, second, third] = appVersion.split(".");

  return {
    containerId,
    appVersion,
    platform,
    systemVersion,
    phoneBrand,
    phoneSeries,
    appMainVersion: `${first}.${second}.${third}`,
  };
};
