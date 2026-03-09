import { db } from '../../src/db';
import { users } from '../../src/schema';
import { count } from 'drizzle-orm';
import fs from 'node:fs';
import path from 'node:path';

async function checkPatches() {
  console.log('--- DIAGNOSTICS: Patch Verification ---');
  const sessionPath = path.resolve(process.cwd(), '../../node_modules/drizzle-orm/bun-sql/postgres/session.js');
  
  if (fs.existsSync(sessionPath)) {
    const content = fs.readFileSync(sessionPath, 'utf8');
    
    // Check for the specific patched line in BunSQLPreparedQuery.execute
    // Original: return client.unsafe(query, params).values();
    // Patched: return await client.unsafe(query, params).values();
    const patchedLine = 'return await client.unsafe(query, params).values();';
    const isPatched = content.includes(patchedLine);
    
    console.log(`[DIAGNOSTIC] File: ${sessionPath}`);
    console.log(`[DIAGNOSTIC] Patch "await client.unsafe(...).values()" applied: ${isPatched ? '✅ YES' : '❌ NO'}`);
    
    if (!isPatched) {
      // Find what's actually there to debug
      const lines = content.split('\n');
      const nearLine = lines.find(l => l.includes('client.unsafe') && l.includes('.values()'));
      if (nearLine) {
        console.log(`[DIAGNOSTIC] Actual line found: "${nearLine.trim()}"`);
      }
    }
  } else {
    console.log(`[DIAGNOSTIC] File not found: ${sessionPath}`);
  }
}

async function run() {
  await checkPatches();
  
  console.log('--- MRE: Starting execution ---');
  
  try {
    console.log('Checking for existing users...');
    const [existingCount] = await db.select({ value: count() }).from(users);
    console.log('Existing users count:', existingCount.value);

    if (existingCount.value === 0) {
      console.log('Inserting 5 sample users...');
      await db.insert(users).values([
        { username: 'user1', email: 'user1@example.com' },
        { username: 'user2', email: 'user2@example.com' },
        { username: 'user3', email: 'user3@example.com' },
        { username: 'user4', email: 'user4@example.com' },
        { username: 'user5', email: 'user5@example.com' },
      ]);
      console.log('Sample users inserted.');
    }

    console.log('Querying final user count...');
    const [finalCount] = await db.select({ value: count() }).from(users);
    
    console.log('--- MRE: Execution finished successfully ---');
    console.log('Result:', finalCount);
    
  } catch (error) {
    console.error('--- MRE: Execution failed with error ---');
    console.error(error);
    process.exit(1);
  }
}

run().then(() => {
  console.log('--- MRE: Script completion reached ---');
});
