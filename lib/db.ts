import mysql from "mysql2/promise";

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

const globalForMysql = global as GlobalWithMysqlPool;

export const pool =
  globalForMysql.mysqlPool ??
  mysql.createPool({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: Number.parseInt(MYSQL_CONNECTION_LIMIT, 10) || 10,
    namedPlaceholders: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForMysql.mysqlPool = pool;
}
