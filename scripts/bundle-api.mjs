/**
 * Build script using Vercel Build Output API v3.
 *
 * Instead of relying on Vercel's auto-detection (which excludes _-prefixed files),
 * this script manually creates the .vercel/output/ directory with:
 * - Bundled serverless functions (esbuild, all local imports inlined)
 * - Static frontend files
 * - Routing configuration
 */

import { build } from 'esbuild';
import { readdirSync, mkdirSync, writeFileSync, readFileSync, cpSync, existsSync, rmSync, renameSync, unlinkSync } from 'fs';
import { join, dirname, relative } from 'path';
import { execSync } from 'child_process';

const API_DIR = 'api';
const OUTPUT_DIR = '.vercel/output';
const FUNCTIONS_DIR = join(OUTPUT_DIR, 'functions');
const STATIC_DIR = join(OUTPUT_DIR, 'static');

// Clean previous output
if (existsSync(OUTPUT_DIR)) {
  rmSync(OUTPUT_DIR, { recursive: true });
}

// ============================================================
// Step 1: Find all API endpoint files (skip underscore-prefixed)
// ============================================================
function findEndpoints(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_')) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findEndpoints(fullPath));
    } else if (entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const entryPoints = findEndpoints(API_DIR);
console.log(`\nBundling ${entryPoints.length} API functions:`);

// ============================================================
// Step 2: Bundle each endpoint with esbuild
// ============================================================
const tmpDir = '.tmp-api-bundle';
if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });

await build({
  entryPoints,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outdir: tmpDir,
  outbase: API_DIR,
  // Bundle everything inline - no external dependencies needed at runtime
});

// ============================================================
// Step 3: Create .vercel/output/functions/ structure
// ============================================================
const vcConfig = {
  runtime: 'nodejs20.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs',
  maxDuration: 30,
};

for (const entry of entryPoints) {
  // entry: api/auth/ensure-profile.ts
  // funcPath: auth/ensure-profile
  const relPath = relative(API_DIR, entry).replace(/\.ts$/, '');
  const funcDir = join(FUNCTIONS_DIR, 'api', `${relPath}.func`);
  const bundledFile = join(tmpDir, `${relPath}.js`);

  mkdirSync(funcDir, { recursive: true });

  // Copy bundled JS as index.mjs
  cpSync(bundledFile, join(funcDir, 'index.mjs'));

  // Write .vc-config.json
  writeFileSync(join(funcDir, '.vc-config.json'), JSON.stringify(vcConfig, null, 2));

  console.log(`  ✓ api/${relPath}`);
}

// Clean up temp bundle dir
rmSync(tmpDir, { recursive: true });

// ============================================================
// Step 4: Build frontend
// ============================================================
console.log('\nBuilding frontend...');
execSync('npm run build', { stdio: 'inherit' });

// ============================================================
// Step 5: Copy frontend build to .vercel/output/static/
// ============================================================
mkdirSync(STATIC_DIR, { recursive: true });
cpSync('frontend/dist', STATIC_DIR, { recursive: true });
console.log('  ✓ Frontend copied to static output');

// ============================================================
// Step 6: Create .vercel/output/config.json (routing)
// ============================================================
const config = {
  version: 3,
  routes: [
    // CORS headers for API
    {
      src: '/api/(.*)',
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
      },
      continue: true,
    },
    // Handle OPTIONS preflight
    {
      src: '/api/(.*)',
      methods: ['OPTIONS'],
      status: 204,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
      },
    },
    // Serve static files first
    { handle: 'filesystem' },
    // SPA fallback for non-API routes
    { src: '/((?!api/).*)', dest: '/index.html' },
  ],
};

writeFileSync(join(OUTPUT_DIR, 'config.json'), JSON.stringify(config, null, 2));
console.log('  ✓ config.json written');

// ============================================================
// Step 7: Delete endpoint .ts files to prevent Vercel auto-detection
// The bundled functions are in .vercel/output/functions/ already
// ============================================================
for (const entry of entryPoints) {
  if (existsSync(entry)) {
    unlinkSync(entry);
  }
}
console.log('  ✓ Source .ts files cleaned up');

console.log(`\nBuild complete. ${entryPoints.length} functions + frontend ready.\n`);
