import pg from "pg";
import fs from "fs";

const { Pool } = pg;

const sslConfig = process.env.NODE_ENV === "production"
  ? { ca: fs.existsSync("/etc/ssl/certs/ca-certificates.crt") ? fs.readFileSync("/etc/ssl/certs/ca-certificates.crt").toString() : undefined, rejectUnauthorized: true }
  : process.env.DATABASE_URL?.includes("neon.tech") ? { rejectUnauthorized: false } : false;

let poolInstance: pg.Pool | null = null;

function getPool() {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return poolInstance;
}

export const pool = {
  query: (text: string, params?: any[]) => getPool().query(text, params),
  end: () => {
    if (poolInstance) {
      return poolInstance.end();
    }
    return Promise.resolve();
  }
} as any;

