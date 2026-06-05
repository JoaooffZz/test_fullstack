import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Garante que variáveis de ambiente estejam carregadas
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não foi definida nas variáveis de ambiente');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
export { Prisma } from '../../generated/prisma/client';
