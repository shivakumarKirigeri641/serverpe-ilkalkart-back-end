const { Pool, types } = require("pg");
require("dotenv").config();

// Keep DATE as string (no timezone changes)
types.setTypeParser(1082, (val) => val);

// Global pools (created only once)
let pool = null;

/* ============================================
   MAIN DB (PGDATABASEMAIN)
   connectDB() stays SYNCHRONOUS: db.js does `const pool = connectDB()`
   at import time and every repo depends on getting a real pool back.
============================================ */
const connectDB = () => {
  if (!pool) {
    pool = new Pool({
      host: process.env.PGHOST,
      database: process.env.PGDATABASEMAIN,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT,
      max: 20,
      idleTimeoutMillis: 30000,
      // 2s was too aggressive: a cold/slow first handshake timed out, so the
      // very first request failed and only worked after a refresh.
      connectionTimeoutMillis: 10000,
      keepAlive: true,
    });
  }
  return pool;
};

// 🔥 Warm the pool and verify connectivity. app.js awaits this BEFORE
// listening, so the cold-connection cost is paid at boot — not on the
// user's first request (which is why it used to fail until a refresh).
const verifyConnection = async () => {
  const p = connectDB();
  await p.query("SELECT NOW()");
  console.log("✅ PostgreSQL connected: serverpeilkalkart DB");
  return p;
};

module.exports = { connectDB, verifyConnection };
