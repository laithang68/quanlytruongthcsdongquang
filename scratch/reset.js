const { PrismaClient } = require('C:/Users/laiva/.gemini/antigravity/scratch/cong-thong-tin-thcs-dong-quang/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function reset() {
  await prisma.luot_truy_cap.deleteMany({});
  console.log('RESET DONE');
}

reset().finally(() => prisma.$disconnect());
