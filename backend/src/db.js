import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Ejecuta una consulta SQL usando el pool compartido de PostgreSQL.
 *
 * @param {string} text Sentencia SQL con parametros opcionales.
 * @param {Array<unknown>} [params=[]] Valores usados por los parametros SQL.
 * @returns {Promise<import("pg").QueryResult>} Resultado de la consulta.
 */
export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result;
}
