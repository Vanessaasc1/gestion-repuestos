import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result;
}
