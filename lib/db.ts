import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

const {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
  MYSQL_CONNECTION_LIMIT,
  MYSQL_PORT,
} = process.env;

// Validate that required environment variables are set
if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_DATABASE) {
  throw new Error(
    "Missing required environment variables: MYSQL_HOST, MYSQL_USER, and MYSQL_DATABASE must be set in .env files"
  );
}

type GlobalWithMysqlPool = typeof globalThis & {
  mysqlPool?: mysql.Pool;
};

const globalWithMysqlPool = global as GlobalWithMysqlPool;

if (!globalWithMysqlPool.mysqlPool) {
  globalWithMysqlPool.mysqlPool = mysql.createPool({
    host: MYSQL_HOST,
    port: MYSQL_PORT ? parseInt(MYSQL_PORT, 10) : 3306,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD || "",
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: MYSQL_CONNECTION_LIMIT
      ? parseInt(MYSQL_CONNECTION_LIMIT, 10)
      : 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
}

export const pool = globalWithMysqlPool.mysqlPool;

/**
 * Helper function to call stored procedures
 * @param name - Name of the stored procedure
 * @param params - Array of parameters to pass to the procedure
 * @returns Array of result rows
 */
export async function callProcedure<T extends RowDataPacket>(
  name: string,
  params: unknown[] = []
): Promise<T[]> {
  const [resultSets] = await pool.query(`CALL ${name}(${params.map(() => '?').join(', ')})`, params);
  
  if (Array.isArray(resultSets)) {
    if (Array.isArray(resultSets[0])) {
      return resultSets[0] as T[];
    }
    return resultSets as T[];
  }
  
  return [];
}
