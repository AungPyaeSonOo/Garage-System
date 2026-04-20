const { Pool } = require("pg");

const isProduction = process.env.DATABASE_URL;

const pool = new Pool(
  isProduction
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    : {
        user: "postgres",
        password: "admin",
        host: "localhost",
        port: 5432,
        database: "autoservice"
      }
);

module.exports = pool;