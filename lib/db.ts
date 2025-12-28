import { PrismaClient } from '@prisma/client';
import { isDevelopment, isProduction } from '@/lib/env';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: isDevelopment() ? ['query', 'error', 'warn'] : ['error'],
  });

if (!isProduction()) globalForPrisma.prisma = db; 