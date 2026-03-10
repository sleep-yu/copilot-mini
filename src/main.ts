import fastify from 'fastify';
import { bindRoutes } from './routes';

const server = fastify({ logger: true });

// 绑定路由
bindRoutes(server);

const PORT = 3000;

async function start() {
  try {
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
