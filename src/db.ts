import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;

export function getPool() {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
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

