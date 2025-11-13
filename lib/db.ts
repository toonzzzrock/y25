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
