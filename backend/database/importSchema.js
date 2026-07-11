const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const sqlFile = path.join(__dirname, 'padaria.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS ?? '',
    multipleStatements: true,
  });

  try {
    await connection.query('CREATE DATABASE IF NOT EXISTS padaria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.query('USE padaria');
    await connection.query(sql);

    console.log('Schema importado com sucesso.');
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tabelas:', tables.map((row) => Object.values(row)[0]));
  } catch (err) {
    console.error('Erro ao importar schema:', err.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
})();
