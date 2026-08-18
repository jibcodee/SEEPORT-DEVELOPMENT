import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Missing DATABASE_URL environment variable');
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

export const query = (text, params) => pool.query(text, params);
