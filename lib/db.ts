import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

const {
  MYSQL_HOST = "localhost",
  MYSQL_USER = "root",
  MYSQL_PASSWORD = "",
  MYSQL_DATABASE = "Y25_DB",
  MYSQL_CONNECTION_LIMIT = "10",
} = process.env;

type GlobalWithMysqlPool = typeof globalThis & {
  mysqlPool?: mysql.Pool;
};

const globalWithMysqlPool = global as GlobalWithMysqlPool;

if (!globalWithMysqlPool.mysqlPool) {
  globalWithMysqlPool.mysqlPool = mysql.createPool({
    host: MYSQL_HOST,
    port: 3306,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: parseInt(MYSQL_CONNECTION_LIMIT, 10),
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
