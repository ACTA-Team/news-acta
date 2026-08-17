'use client';

/**
 * Per-page override for the language switcher's targets.
 *
 * By default the switcher just swaps the locale segment of the current path,
 * which is correct for every static route. Article and monthly-review pages are
 * the exception: a Spanish translation has its own slug, and an article with no
 * translation has no Spanish URL at all. Those pages know the right answer
 * server-side, so they register it here and the switcher reads it.
 *
 * Registration happens in an effect, so the very first paint uses the default
 * segment swap. That is the correct target for every route except an untranslated
 * article, where it is corrected before the user can realistically click.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Locale } from './config';

export type AlternatePathMap = Partial<Record<Locale, string>>;

interface AlternateLocalePathsContextValue {
  paths: AlternatePathMap | null;
  register: (paths: AlternatePathMap | null) => void;
}

const AlternateLocalePathsContext = createContext<AlternateLocalePathsContextValue | null>(null);

export function AlternateLocalePathsProvider({ children }: { children: ReactNode }) {
  const [paths, setPaths] = useState<AlternatePathMap | null>(null);

  const register = useCallback((next: AlternatePathMap | null) => {
    setPaths(next);
  }, []);

  const value = useMemo(() => ({ paths, register }), [paths, register]);

  return (
    <AlternateLocalePathsContext.Provider value={value}>
      {children}
    </AlternateLocalePathsContext.Provider>
  );
}

/** The registered overrides, or null when the current page has none. */
export function useAlternateLocalePaths(): AlternatePathMap | null {
  return useContext(AlternateLocalePathsContext)?.paths ?? null;
}

/**
 * Registers the current page's per-locale URLs. Rendered by a Server Component
 * page with values it computed from the database.
 *
 * Serializing to a string keeps the effect from re-running on every render just
 * because the object identity changed across a re-render of the parent.
 */
export function SetAlternateLocalePaths({ paths }: { paths: AlternatePathMap }) {
  const context = useContext(AlternateLocalePathsContext);
  const register = context?.register;
  const serialized = JSON.stringify(paths);

  useEffect(() => {
    if (!register) return;
    register(JSON.parse(serialized) as AlternatePathMap);
    return () => register(null);
  }, [register, serialized]);

  return null;
}
