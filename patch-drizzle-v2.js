const fs = require('fs');
const path = require('path');

/**
 * Patch 1: For bun-sql session
 */
function patchBunSQLSession(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    const originalCodeFilePath = path.join(path.dirname(filePath), `${path.basename(filePath, path.extname(filePath))}.orig${path.extname(filePath)}`);
    const search = /return client\.unsafe\(query, params\)\.values\(\);/g;
    const replace = 'return await client.unsafe(query, params).values();';

    if (content.match(search)) {
        content = content.replace(search, replace);
        if (!fs.existsSync(originalCodeFilePath)) {
            fs.writeFileSync(originalCodeFilePath, originalContent);
            console.log(`[PATCHER] Backed up original code to: ${originalCodeFilePath}`);
        }
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
    const originalCode = code;
    let modified = false;

    // Sub-patch A: 'skip' strategy
    const searchSkip =
        /if\s*\(\s*cacheStrat\.type\s*===\s*['"]skip['"]\s*\)\s*return\s*query\(\)\.catch\(\s*\(e\)\s*=>\s*\{([\s\S]*?)\}\s*\);/g;
    const replaceSkip =
        'if (cacheStrat.type === "skip") { try { return await query(); } catch(e) { $1 } }';

    if (code.match(searchSkip)) {
        code = code.replace(searchSkip, replaceSkip);
        modified = true;
        console.log(`[PATCHER] Applied Pg-Core 'skip' patch to: ${filePath}`);
    }

    // Sub-patch B: 'invalidate' strategy
    const searchInvalidate =
        /if\s*\(\s*cacheStrat\.type\s*===\s*['"]invalidate['"]\s*\)\s*return\s*Promise\.all\(\s*\[\s*query\(\)\s*,\s*cache\.onMutate\(\s*\{\s*tables:\s*cacheStrat\.tables\s*\}\s*\)\s*\]\s*\)\.then\(\s*\(res\)\s*=>\s*res\[0\]\s*\)\.catch\(\s*\(e\)\s*=>\s*\{([\s\S]*?)\}\s*\);/g;
    const replaceInvalidate =
        'if (cacheStrat.type === "invalidate") { try { const [result] = await Promise.all([query(), cache.onMutate({ tables: cacheStrat.tables })]); return result; } catch (e) { $1 } }';

    if (code.match(searchInvalidate)) {
        code = code.replace(searchInvalidate, replaceInvalidate);
        modified = true;
        console.log(`[PATCHER] Applied Pg-Core 'invalidate' patch to: ${filePath}`);
    }

    // Sub-patch C: 'const cacheStrat = this.cache !== void 0 ||'
    const searchCacheStrat = 'const cacheStrat = this.cache !== void 0 || ';
    const replaceCacheStrat = 'const cacheStrat = this.cache !== void 0 && !';
    if (code.includes(searchCacheStrat)) {
        code = code.replace(searchCacheStrat, replaceCacheStrat);
        modified = true;
        console.log(`[PATCHER] Applied Pg-Core cacheStrat condition patch to: ${filePath}`);
    }

    if (modified) {
        const originalCodeFilePath = path.join(path.dirname(filePath), `${path.basename(filePath, path.extname(filePath))}.orig${path.extname(filePath)}`);
        if (!fs.existsSync(originalCodeFilePath)) {
            fs.writeFileSync(originalCodeFilePath, originalCode);
            console.log(`[PATCHER] Backed up original code to: ${originalCodeFilePath}`);
        }
        fs.writeFileSync(filePath, code);
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
