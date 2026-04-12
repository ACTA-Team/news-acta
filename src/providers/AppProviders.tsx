'use client';

/**
 * Global container for client-side providers (theme, analytics, query client, etc.).
 *
 * Starts empty — add providers here and wrap it in the root layout
 * when needed (e.g. `ThemeProvider`, `QueryClientProvider`).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
