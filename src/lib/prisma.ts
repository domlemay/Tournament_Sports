import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

type G = typeof globalThis & { _prisma?: PrismaClient };

function build(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return new PrismaClient({ adapter: new PrismaNeonHttp(url, {}) });
}

function instance(): PrismaClient {
  const g = globalThis as G;
  if (!g._prisma) g._prisma = build();
  return g._prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return Reflect.get(instance(), prop);
  },
});
