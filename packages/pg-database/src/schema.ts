import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';
import { bigintDecimalJS, zeroDecimal } from './customTypes';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 32 }).notNull().unique(),
  email: varchar('email', { length: 256 }).notNull().unique(),
  kisses: bigintDecimalJS('kisses').notNull().default(zeroDecimal),
  isVerified: boolean('is_verified').notNull().default(false),
  regDate: timestamp('reg_date', { withTimezone: true, precision: 3 }).notNull().defaultNow(),
});
