import { NextResponse, type NextRequest } from 'next/server';
import { LOCALE_COOKIE, negotiateLocale } from '@/i18n';
import { localizedUrl } from '@/lib/url';

/**
 * Compatibility redirect for the pre-bilingual feed URL.
 *
 * There is one feed per language now, at `/<locale>/rss.xml`. Anyone already
 * subscribed to `/rss.xml` keeps working: they are sent to the feed for their
 * negotiated locale, with the same cookie-then-header precedence the rest of the
 * site uses.
 *
 * This has to be a route handler rather than a proxy rule: the proxy matcher
 * deliberately skips `.xml` paths so `/sitemap.xml` is never rewritten.
 *
 * 302 rather than 301: the target depends on the request's own locale signals, so
 * it is not a permanent one-to-one move and must not be cached as one.
 */
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const locale = negotiateLocale({
    cookie: request.cookies.get(LOCALE_COOKIE)?.value,
    acceptLanguage: request.headers.get('accept-language'),
  });

  return NextResponse.redirect(localizedUrl(locale, '/rss.xml'), 302);
}
