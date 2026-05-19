import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../../generated/prisma/index.js");
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
export { prisma };
