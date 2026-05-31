import pg from "pg";
import fs from "fs";

const { Pool } = pg;

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.PGHOST || "localhost";
  const port = process.env.PGPORT || "5432";
  const user = process.env.PGUSER || "postgres";
  const password = process.env.PGPASSWORD || "postgres";
  const database = process.env.PGDATABASE || "krealogs";
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

const sslConfig = process.env.NODE_ENV === "production"
  ? { ca: fs.existsSync("/etc/ssl/certs/ca-certificates.crt") ? fs.readFileSync("/etc/ssl/certs/ca-certificates.crt").toString() : undefined, rejectUnauthorized: true }
  : false;

let poolInstance: pg.Pool | null = null;

function getPool() {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: getDatabaseUrl(),
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

