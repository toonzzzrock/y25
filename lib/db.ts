import mysql from 'mysql2/promise';
import { env } from './env';

// MySQL connection pool using mysql2/promise
// Configured using environment variables from .env.local or .env.production
const pool = mysql.createPool({
  host: env.MYSQL_HOST,
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: +(env.MYSQL_CONNECTION_LIMIT || 10),
  queueLimit: 0,
});

export async function getAllUsers(): Promise<any[]> {
  const [rows] = await pool.query('SELECT * FROM `User`');
  // rows is typed as any; return as array of records
  return rows as any[];
}

export { pool };

// Helper to call stored procedures consistently
export async function callProcedure<T = any[]>(name: string, params: any[] = []): Promise<T> {
  // mysql2 returns [rows, fields] for CALL; rows itself is an array of result sets
  const [resultSets] = await pool.query(`CALL ${name}(${params.map(() => '?').join(', ')})`, params);
  // For most procedures, the first result set is at index 0
  // mysql2 wraps it as [rows, ...] when multiple SELECTs are present
  const rows = Array.isArray(resultSets) ? (resultSets as any)[0] ?? resultSets : (resultSets as any);
  return rows as T;
}
