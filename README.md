# MRE: Silent Exit (Code 0) in `drizzle-orm/bun-sql`

This project reproduces a critical issue where the Bun process exits silently with code 0 during a database query execution when using the `drizzle-orm/bun-sql` driver inside a Docker container.

## Environment
- **Bun:** 1.3.10 (Linux x64 baseline)
- **Drizzle ORM:** ^1.0.0-beta.16-ea816b6
- **Database:** PostgreSQL 18
- **OS:** Reproduced on Windows (Docker Desktop) and Linux.

## Bug Description
When executing `await db.select({ value: count() }).from(users)`, the process terminates immediately with exit code 0 without throwing any errors or completing the promise.

### Key Observations:
1. **Observed Context:** In the original project, this silent exit occurs at the beginning of the `seedUsers` function, even if the `users` table is empty.
2. **Execution Flow:** The failure happens consistently when this query is preceded by other database operations (like `INSERT` statements in a prior `seedStaticData` call) within the same process/session.
3. **Schema Correlation:** The issue appears to be linked to the presence of custom types (such as `bigintDecimalJS` using `decimal.js`) in the schema definition, although these columns are not explicitly part of the failing `count()` query.
4. **Insufficient Patches:** This MRE includes a patching script (`patch-drizzle-v2.js`) that applies suggested `await` additions to `drizzle-orm` source files. **The issue persists even when these patches are active.**

## Structure
- `packages/pg-database/src/schema.ts`: Contains the table definition with custom types.
- `packages/pg-database/src/customTypes.ts`: Implementation of the `bigintDecimalJS` type.
- `packages/pg-database/scripts/seeding/index.ts`: Reproduction script with diagnostic logs.
- `patch-drizzle-v2.js`: The patching logic applied during Docker build.

## How to Reproduce
1. Ensure you have Docker and Docker Compose installed.
2. Run the following command:
   ```bash
   docker compose run --rm seeder
   ```

## Expected vs Actual Output
- **Expected:** The script should print "Query finished successfully" and show the user count.
- **Actual:** The script prints "Querying... user count..." and the process exits silently with code 0.
