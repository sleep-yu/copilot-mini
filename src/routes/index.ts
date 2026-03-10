import { FastifyInstance } from 'fastify';
import copilot from '../copilot';

export const bindRoutes = (server: FastifyInstance) => {
  // 对话接口
  server.post('/chat', async (request, reply) => {
    const { appName, userId, message } = request.body as any;

    if (!appName || !userId || !message) {
      return reply.code(400).send({ error: '缺少必要参数' });
    }

    const response = await copilot.chat(appName, userId, message);
    return reply.send(response);
  });

  // 健康检查
  server.get('/health', async (request, reply) => {
    return { status: 'ok' };
  });
};
