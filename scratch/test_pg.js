const path = require('path');
const { Client } = require(path.join(__dirname, '../backend/node_modules/pg'));

const client = new Client({
  host: '127.0.0.1',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'thcs_dong_quang',
});

client.connect()
  .then(() => {
    console.log('PG CONNECT SUCCESS ON 5433!');
    return client.query('SELECT count(*) FROM nguoi_dung');
  })
  .then((res) => {
    console.log('Query result count:', res.rows[0].count);
    client.end();
  })
  .catch((err) => {
    console.error('PG CONNECT ERROR:', err.message);
    client.end();
  });
