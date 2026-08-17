const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));

// Connect to default 'postgres' db to create 'thcs_dong_quang'
const clientInit = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5433/postgres?schema=public' } }
});

async function setup() {
  await clientInit.$connect();
  console.log('Connected to postgres default db!');
  
  // Set password to postgres
  await clientInit.$executeRawUnsafe(`ALTER USER postgres WITH PASSWORD 'postgres';`);
  console.log('Set postgres password to postgres!');

  // Create database thcs_dong_quang if not exists
  try {
    await clientInit.$executeRawUnsafe(`CREATE DATABASE thcs_dong_quang;`);
    console.log('Created database thcs_dong_quang!');
  } catch (e) {
    console.log('Database thcs_dong_quang already exists or note:', e.message);
  }
}

setup().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
