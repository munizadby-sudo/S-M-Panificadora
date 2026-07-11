const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASS ?? '',
  database:           process.env.DB_NAME     || 'padaria',

  charset:            'utf8mb4',
  timezone:           '-03:00',

  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  connectTimeout:     10000,
  decimalNumbers:     true,
});

async function testarConexao() {
  try {
    const conn = await pool.getConnection();
    console.log('✅  MySQL conectado — charset utf8mb4');
    conn.release();
  } catch (err) {
    console.warn('⚠️  MySQL indisponível:', err.message);
    throw err;
  }
}

module.exports = pool;
module.exports.testarConexao = testarConexao;