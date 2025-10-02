// lib/prisma.ts
import { PrismaClient } from "@/prisma/generated/database";

declare global {
  // This allows reuse of the PrismaClient instance in development
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
});

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

// Ensure connection on startup
async function ensureConnection() {
  try {
    await prisma.$connect();
    console.log("Offline Prisma client connected successfully");
  } catch (error) {
    console.error("Failed to connect offline Prisma client:", error);
  }
}

// Auto-connect when module is imported
ensureConnection();

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;