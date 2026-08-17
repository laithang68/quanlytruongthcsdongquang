const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.thong_bao.count();
  const records = await prisma.thong_bao.findMany({ take: 5 });
  console.log('Tong so thong bao trong CSDL:', count);
  console.log('Sample thong bao:', JSON.stringify(records, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
