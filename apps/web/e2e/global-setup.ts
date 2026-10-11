import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

/** Resets the test database to known fixtures before the run. */
export default function globalSetup(): void {
  execSync('npm run e2e:fixtures -w @ds/api', {
    cwd: resolve(__dirname, '../../..'),
    stdio: 'inherit',
  });
}
