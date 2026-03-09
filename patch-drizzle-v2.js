const fs = require('fs');
const path = require('path');

/**
 * Patch 1: For bun-sql session
 */
function patchBunSQLSession(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    const search = /return client\.unsafe\(query, params\)\.values\(\);/g;
    const replace = 'return await client.unsafe(query, params).values();';

    if (content.match(search)) {
        content = content.replace(search, replace);
        fs.writeFileSync(filePath, content);
        console.log(`[PATCHER] Applied Bun-SQL patch to: ${filePath}`);
    }
}

/**
 * Patch 2: The "pg-core" patch for cache strategy
 */
function patchPgCoreSession(filePath) {
    if (!fs.existsSync(filePath)) return;
    let code = fs.readFileSync(filePath, 'utf8');
    const search =
        /if\s*\(\s*cacheStrat\.type\s*===\s*['"]skip['"]\s*\)\s*return\s*query\(\)\.catch\(\s*\(e\)\s*=>\s*\{([\s\S]*?)\}\s*\);/g;
    const replace =
        'if (cacheStrat.type === "skip") { try { return await query(); } catch(e) { $1 } }';

    if (code.match(search)) {
        code = code.replace(search, replace);
        fs.writeFileSync(filePath, code);
        console.log(`[PATCHER] Applied Pg-Core patch to: ${filePath}`);
    }
}

// Execute Patch 1
[
    'node_modules/drizzle-orm/bun-sql/postgres/session.js',
    'node_modules/drizzle-orm/bun-sql/postgres/session.cjs',
].forEach((f) => patchBunSQLSession(path.resolve(process.cwd(), f)));

// Execute Patch 2
[
    'node_modules/drizzle-orm/pg-core/async/session.js',
    'node_modules/drizzle-orm/pg-core/async/session.cjs',
].forEach((f) => patchPgCoreSession(path.resolve(process.cwd(), f)));
