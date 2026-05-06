import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import os from 'os';

function findChromium(): string | undefined {
  const base = path.join(os.homedir(), '.cache', 'ms-playwright');
  try {
    const result = execSync(`find ${base} -name chrome -path '*/chrome-linux64/*' 2>/dev/null | head -1`, { encoding: 'utf8' }).trim();
    return result || undefined;
  } catch {
    return undefined;
  }
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        executablePath: process.env.CHROMIUM_PATH ?? findChromium(),
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
    },
  ],
});
