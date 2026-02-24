import { PrismaClient } from '@/generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';

let adapter;

if (process.env.NODE_ENV === 'production') {
  adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
} else {
  adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
