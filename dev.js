/**
 * dev.js - Clean Next.js dev server launcher for Windows/OneDrive environments
 *
 * Fixes:
 *   - EPERM .next/trace (OneDrive locking .next)  → .next is a symlink to C:\Projects\.next-cache\provider-web
 *   - Cannot find module 'react/jsx-runtime'       → stale compiled cache is wiped on every start
 *
 * Usage: npm run dev  (calls: node dev.js)
 */

const fs   = require('fs');
const path = require('path');
const cp   = require('child_process');

const root     = __dirname;
const nextDir  = path.join(root, '.next');

// ─── 1. Wipe stale build cache ─────────────────────────────────────────────
// Old compiled bundles bake absolute module paths into them.
// If node_modules moves or is reinstalled, those paths go stale and cause
// "Cannot find module 'react/jsx-runtime'" on startup.
// Wiping on every dev start is cheap — Next.js recompiles incrementally anyway.
try {
  if (fs.existsSync(nextDir)) {
    // Only wipe the server/ and static/ subdirs — these hold stale bundles.
    // Preserve cache/webpack if present for faster rebuilds... but on Windows
    // the safest approach is a full wipe, because partial stale state causes
    // harder-to-diagnose module resolution errors.
    const stat = fs.lstatSync(nextDir);
    if (stat.isSymbolicLink()) {
      // Symlink exists → wipe the *target* contents, not the link itself
      const target = fs.realpathSync(nextDir);
      const entries = fs.readdirSync(target);
      for (const entry of entries) {
        const full = path.join(target, entry);
        fs.rmSync(full, { recursive: true, force: true });
      }
      console.log('[dev.js] Cleared stale build cache (symlink target wiped)');
    } else {
      // Plain directory — wipe it
      fs.rmSync(nextDir, { recursive: true, force: true });
      fs.mkdirSync(nextDir, { recursive: true });
      console.log('[dev.js] Cleared stale build cache');
    }
  } else {
    // No .next at all — Next.js will create it (or symlink is broken)
    fs.mkdirSync(nextDir, { recursive: true });
  }
} catch (e) {
  console.warn('[dev.js] Could not clear cache:', e.code, e.message);
  console.warn('[dev.js] Continuing anyway — Next.js may still work.');
}

// ─── 2. Verify .next is writable ───────────────────────────────────────────
try {
  const testFile = path.join(nextDir, '.write-test');
  fs.writeFileSync(testFile, 'ok');
  fs.unlinkSync(testFile);
} catch (e) {
  console.error('[dev.js] .next is not writable:', e.message);
  console.error('[dev.js] Re-run the symlink setup:');
  console.error('   rmdir /s /q .next');
  console.error('   mklink /D .next C:\\Projects\\.next-cache\\provider-web');
  process.exit(1);
}

// ─── 3. Start exactly ONE Next.js dev server ───────────────────────────────
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');

console.log('[dev.js] Starting Next.js dev server...');

const child = cp.spawn(process.execPath, [nextBin, 'dev'], {
  stdio: 'inherit',
  cwd: root,
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: '1',
  },
});

child.on('error', (err) => {
  console.error('[dev.js] Failed to start Next.js:', err.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) process.exit(0);
  process.exit(code ?? 0);
});

// Forward termination signals cleanly (Ctrl+C, etc.)
process.on('SIGINT',  () => { child.kill('SIGINT');  process.exit(0); });
process.on('SIGTERM', () => { child.kill('SIGTERM'); process.exit(0); });