import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "../../generated/prisma/client.js";
const { PrismaClient } = pkg;
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
export { prisma };
