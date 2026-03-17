import { FastifyInstance } from "fastify";
import { Copilot } from "@/class/copilot";
import { storage } from "./storage";
import { createObjectId } from "@/common/utils";

const copilot = new Copilot();

export default copilot;