import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    // Mirror the `@/*` → `./src/*` alias from tsconfig.json.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
