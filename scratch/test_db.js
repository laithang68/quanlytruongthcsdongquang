const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));

const clientLocalhost = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5433/thcs_dong_quang?schema=public' } }
});

clientLocalhost.$connect()
  .then(() => {
    console.log('SUCCESS! Connected to PostgreSQL 17 on localhost:5433!');
    return clientLocalhost.nguoi_dung.count();
  })
  .then((count) => {
    console.log('User count in DB thcs_dong_quang:', count);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed on localhost:5433:', err.message);
    process.exit(1);
  });
