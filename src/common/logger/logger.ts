import bunyan from 'bunyan'

const logger = bunyan.createLogger({
  name: "copilot-mini-server",
  level: process.env.LOG_LEVEL as bunyan.LogLevel || "info",
  serializers: bunyan.stdSerializers,
});

export default logger;