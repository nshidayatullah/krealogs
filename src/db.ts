import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;

export function getPool() {
  if (!poolInstance) {
    console.log("INITIALIZING POSTGRESQL POOL IN DB.TS");
    console.log("DATABASE_URL starting with: ", process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + "..." : "UNDEFINED");
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

