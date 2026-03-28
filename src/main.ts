import { config } from 'dotenv';
config({ path: '/www/wwwroot/copilot-mini/.env' });
import 'dotenv/config';
import fastify from "fastify";
import cors from "@fastify/cors";
import mongoose from 'mongoose';
import { bindRoutes } from "./routes";
import { bindHooks } from "./common/hooks";
import { getEnvConfig } from "./common/utils/env";

const MONGODB_URL = getEnvConfig("MONGODB_URL") as string;
const PORT = +(getEnvConfig("PORT") || 3000);

async function start() {
  const server = fastify({ logger: true });

  // CORS 配置
  await server.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  bindHooks(server);
  bindRoutes(server);

  try {
    // Connect Database
    if (MONGODB_URL) {
      await mongoose.connect(MONGODB_URL);
      console.log("Connected to MongoDB:", MONGODB_URL);
    }

    // Start Server
    server.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`Server listening at ${address}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
