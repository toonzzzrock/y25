import mysql from 'mysql2/promise';

// MySQL connection pool using mysql2/promise
// Configure using environment variables. Defaults assume local dev.
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'y25_db',
  waitForConnections: true,
  connectionLimit: +(process.env.MYSQL_CONNECTION_LIMIT || 10),
  queueLimit: 0,
});

export async function getAllUsers(): Promise<any[]> {
  const [rows] = await pool.query('SELECT * FROM `user`');
  // rows is typed as any; return as array of records
  return rows as any[];
}

export { pool };
