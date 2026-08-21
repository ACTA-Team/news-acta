// Vitest stand-in for Next.js's `server-only` marker package.
// Next.js aliases the real package to a no-op at build time (see
// `node_modules/next/dist/compiled/server-only`); it is never installed as a
// real dependency, so it cannot resolve under plain Node. This mirrors that
// aliasing for `vitest.config.ts` so server-only modules stay importable in
// tests without weakening the guard in the actual Next.js build.
export {};
