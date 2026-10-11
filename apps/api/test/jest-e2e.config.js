/** Integration/e2e tests: boot the full app against the test database (.env.test). */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.e2e-spec.ts$',
  transform: { '^.+\.ts$': 'ts-jest' },
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/silence-logs.ts'],
  testTimeout: 30000,
};
