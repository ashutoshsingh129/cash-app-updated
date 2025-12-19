const { Pool } = require("pg");
require("dotenv").config();

const dbConfig = {
  user: process.env.DB_USER || "stripe",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "stripedb",
  password: process.env.DB_PASSWORD || "mypassword",
  port: process.env.DB_PORT || 5432,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(dbConfig);

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("Database connected successfully");
    client.release();
    return true;
  } catch (err) {
    console.error("Database connection failed:", err);
    return false;
  }
};

const initializeDatabase = async () => {
  try {
    const client = await pool.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email 
      ON users(email)
    `);

    client.release();
    console.log("Database tables initialized successfully");
    return true;
  } catch (err) {
    console.error("Database initialization failed:", err);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
};
