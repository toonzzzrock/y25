import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";

const {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
  MYSQL_CONNECTION_LIMIT,
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

const globalForMysql = global as GlobalWithMysqlPool;

export const pool =
  globalForMysql.mysqlPool ??
  mysql.createPool({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD || "",
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: MYSQL_CONNECTION_LIMIT
      ? Number.parseInt(MYSQL_CONNECTION_LIMIT, 10)
      : 10,
    namedPlaceholders: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForMysql.mysqlPool = pool;
}

/**
 * Call a stored procedure and return the result set
 * @param name - The name of the stored procedure
 * @param params - The parameters to pass to the stored procedure
 * @returns The result set from the stored procedure
 */
export async function callProcedure<T extends RowDataPacket>(
  name: string,
  params: unknown[] = []
): Promise<T[]> {
  const [resultSets] = await pool.query(`CALL ${name}(${params.map(() => '?').join(', ')})`, params);
  if (Array.isArray(resultSets) && resultSets.length > 0) {
    return resultSets[0] as T[];
  }
  return [] as T[];
}

