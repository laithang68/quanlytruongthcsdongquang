const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  const types = await prisma.loai_van_ban.findMany();
  const docs = await prisma.van_ban.findMany({
    include: { loai_van_ban: true },
  });
  console.log('LOAI VAN BAN:', JSON.stringify(types, null, 2));
  console.log('VAN BAN COUNT:', docs.length);
  if (docs.length > 0) {
    console.log('SAMPLE DOC:', JSON.stringify(docs[0], null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
