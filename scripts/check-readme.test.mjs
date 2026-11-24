import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('checks tracked files from the repository root when invoked from a subdirectory', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'flisk-readme-check-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scripts = join(root, 'scripts');
  mkdirSync(scripts);
  copyFileSync(new URL('./check-readme.mjs', import.meta.url), join(scripts, 'check-readme.mjs'));
  execFileSync('git', ['init', '--quiet'], { cwd: root });
  const stale = ['flisk', 'cli', 'core'].join('-');
  writeFileSync(join(root, 'README.md'), `https://github.com/flisk-sh/${stale}\n`);
  execFileSync('git', ['add', 'README.md', 'scripts/check-readme.mjs'], { cwd: root });

  const result = spawnSync(process.execPath, ['check-readme.mjs'], { cwd: scripts, encoding: 'utf8' });
  assert.ifError(result.error);
  assert.equal(result.status, 1, result.stdout || result.stderr);
  assert.match(result.stderr, new RegExp(`^README\\.md:1 mentions ${stale}$`, 'm'));
});
