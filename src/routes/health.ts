import { FastifyRequest, FastifyReply } from "fastify";

export default async function healthHandler(request: FastifyRequest, reply: FastifyReply) {
  return { status: 'ok', uptime: process.uptime() }
}