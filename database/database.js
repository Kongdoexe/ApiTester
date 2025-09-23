const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '117.18.125.19',
  port: 3306,                 // ใส่พอร์ตชัดเจน
  user: 'apiuser',
  password: 'apipassword',  // อย่าให้ว่างถ้ามีจริง
  database: 'dbApiTester',
  waitForConnections: true,
  connectionLimit: 30,
  queueLimit: 0,
  connectTimeout: 15000,      // 15s
});

(async () => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    console.log('DB OK:', rows);
  } catch (e) {
    console.error('DB CONNECT FAIL:', e);
  }
})();

async function connectdb() {
  return pool.getConnection();
}

module.exports = { pool, connectdb };
