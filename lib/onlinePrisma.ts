// lib/prisma.ts
import { PrismaClient } from "@/prisma/generated/online";

declare global {
  // This allows reuse of the PrismaClient instance in development
  var onlinePrisma: PrismaClient | undefined;
}

const onlinePrisma = globalThis.onlinePrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
});

if (process.env.NODE_ENV !== "production") globalThis.onlinePrisma = onlinePrisma;

// Ensure connection on startup
async function ensureConnection() {
  try {
    await onlinePrisma.$connect();
    console.log("Online Prisma client connected successfully");
  } catch (error) {
    console.error("Failed to connect online Prisma client:", error);
  }
}

// Auto-connect when module is imported
ensureConnection();

// Graceful shutdown
process.on('beforeExit', async () => {
  await onlinePrisma.$disconnect();
});

export default onlinePrisma;