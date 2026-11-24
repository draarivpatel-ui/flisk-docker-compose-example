import { execFileSync } from 'node:child_process';
import { accessSync, constants, readFileSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The source repo was renamed to flisk; stale link text sends readers to a 404.
// The old name is assembled from parts so this script does not flag itself.
const STALE = ['flisk', 'cli', 'core'].join('-');
const root = fileURLToPath(new URL('../', import.meta.url));
// Resolve git to an absolute path so the lookup never picks up a writeable PATH entry.
const git = (process.env.PATH || '').split(delimiter)
  .map((dir) => join(dir, 'git'))
  .find((candidate) => {
    try {
      accessSync(candidate, constants.X_OK);
      return true;
    } catch {
      return false;
    }
  });
if (!git) {
  console.error('no git executable found on PATH');
  process.exit(1);
}
const files = execFileSync(git, ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);
const hits = [];
for (const file of files) {
  let text;
  try {
    text = readFileSync(join(root, file), 'utf8');
  } catch {
    continue;
  }
  text.split(/\r?\n/).forEach((line, index) => {
    if (line.includes(STALE)) hits.push(`${file}:${index + 1} mentions ${STALE}`);
  });
}
if (hits.length) {
  console.error(hits.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`no tracked file mentions ${STALE}`);
}
