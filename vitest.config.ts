import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      // Mirror the `@/*` → `./src/*` alias from tsconfig.json.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Next.js aliases `server-only` to a no-op at build time; it is not a
      // real dependency, so it cannot resolve under plain Node. See
      // `src/test/server-only-stub.ts`.
      'server-only': fileURLToPath(new URL('./src/test/server-only-stub.ts', import.meta.url)),
    },
  },
});
