import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const clientDir = resolve(root, 'dist/client');

if (!existsSync(clientDir)) {
  throw new Error('dist/client does not exist. Run `npm run build` first.');
}

const workDir = mkdtempSync(join(tmpdir(), 'boxlab-gh-pages-'));
try {
  cpSync(clientDir, workDir, { recursive: true });
  cpSync(resolve(clientDir, 'index.html'), resolve(workDir, '404.html'));
  writeFileSync(resolve(workDir, '.nojekyll'), '');
  rmSync(resolve(workDir, '.DS_Store'), { force: true });

  const remoteUrl = execFileSync('git', ['remote', 'get-url', 'github'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();

  execFileSync('git', ['init', '-b', 'gh-pages'], { cwd: workDir, stdio: 'inherit' });
  execFileSync('git', ['add', '-A'], { cwd: workDir, stdio: 'inherit' });
  execFileSync('git', ['commit', '-m', 'Deploy BoxLab to GitHub Pages'], {
    cwd: workDir,
    stdio: 'inherit',
  });
  execFileSync('git', ['push', '-f', remoteUrl, 'gh-pages:gh-pages'], {
    cwd: workDir,
    stdio: 'inherit',
  });
  console.log('\nDeployed to https://banye0517.github.io/packaging-preview/');
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
