const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const rows = await prisma.luot_truy_cap.findMany({
    orderBy: { lan_cuoi_hoat_dong: 'desc' }
  });
  console.log('TOTAL ROWS IN LUOT_TRUY_CAP:', rows.length);
  console.log('ROWS DETAILS:', JSON.stringify(rows, null, 2));

  const now = new Date();
  const onlineThreshold = new Date(now.getTime() - 5 * 60 * 1000);
  console.log('NOW:', now.toISOString());
  console.log('ONLINE THRESHOLD (-5m):', onlineThreshold.toISOString());

  const activeOnline = rows.filter(r => new Date(r.lan_cuoi_hoat_dong) >= onlineThreshold);
  console.log('ACTIVE ONLINE COUNT:', activeOnline.length);
}

check().finally(() => prisma.$disconnect());
