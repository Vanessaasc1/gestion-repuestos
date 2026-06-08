import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Executes a SQL query using the shared PostgreSQL connection pool.
 *
 * @param {string} text SQL sentence with optional parameter placeholders.
 * @param {Array<unknown>} [params=[]] Values used by the SQL placeholders.
 * @returns {Promise<import("pg").QueryResult>} PostgreSQL query result.
 */
export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result;
}
