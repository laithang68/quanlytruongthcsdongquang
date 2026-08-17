const { PrismaClient } = require('@prisma/client');

const passwords = [
  'postgres',
  '123456',
  'admin',
  'root',
  '12345678',
  '123456789',
  'laivanthang0611',
  'thangbe6868',
  'laithang68',
  'thang123',
  'postgres123',
  'admin123',
  'root123',
  'elearning',
  'elearning123',
  'password',
  '1234',
  '0611',
  '06112026',
  'Admin@123',
  'Postgres@123',
  '123456789a',
  '123456789A',
];

async function check() {
  for (const pw of passwords) {
    const url = `postgresql://postgres:${encodeURIComponent(pw)}@localhost:5432/postgres?schema=public`;
    const prisma = new PrismaClient({
      datasources: { db: { url } },
    });
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log(`REAL_PASSWORD_FOUND:${pw}`);
      await prisma.$disconnect();
      return;
    } catch (e) {
      await prisma.$disconnect();
    }
  }
  console.log('NO_PASSWORD_MATCHED');
}

check();
