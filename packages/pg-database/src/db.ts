import { drizzle } from 'drizzle-orm/bun-sql';
import * as schema from './schema';

const DB_URL = process.env.DB_URL || 'postgres://user:password@db:5432/db';

export const db = drizzle({
  connection: {
    url: DB_URL,
  },
  schema,
});
