import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
  isUnlocalizedPath,
  localeFromPathname,
  negotiateLocale,
  withLocale,
  type Locale,
} from '@/i18n';
import type { Database } from '@/lib/supabase/database.types';
import { hasSupabasePublicEnv, supabaseEnv } from '@/lib/supabase/env';

/**
 * Locale negotiation happens before anything else, and before the admin check.
 *
 * A request with no locale prefix (`/news`, or `/` from a bookmark) is redirected
 * to the negotiated one. Precedence is cookie, then `Accept-Language`, then the
 * default: the cookie represents a choice the reader made in the switcher, so it
 * has to outrank whatever their browser advertises.
 *
 * `/admin`, `/api`, `/auth` and the metadata routes are never prefixed, so they
 * skip this entirely.
 */
function redirectToLocale(request: NextRequest, locale: Locale): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = withLocale(locale, request.nextUrl.pathname);

  const response = NextResponse.redirect(url);

  // Remember the negotiated locale so the next unprefixed request skips the
  // header sniffing. A cookie already present is left alone: it either matches
  // or the reader is following a link into the other language, and a redirect is
  // not the place to overwrite their preference.
  if (!isLocale(request.cookies.get(LOCALE_COOKIE)?.value)) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
  }

  return response;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isUnlocalizedPath(pathname)) {
    const pathLocale = localeFromPathname(pathname);

    if (!pathLocale) {
      const negotiated = negotiateLocale({
        cookie: request.cookies.get(LOCALE_COOKIE)?.value,
        acceptLanguage: request.headers.get('accept-language'),
      });
      return redirectToLocale(request, negotiated);
    }
  }

  if (!hasSupabasePublicEnv()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const isAdminPath = pathname.startsWith('/admin');
  const isAdminLogin = pathname === '/admin/login';

  // Only the admin branch needs the session, and `getUser()` is a network round
  // trip, so the public site does not pay for it.
  if (isAdminPath && !isAdminLogin) {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user?.email) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    if (user.app_metadata?.provider !== 'email') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('email, role')
      .eq('email', user.email.toLowerCase())
      .maybeSingle();

    if (!adminUser) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Team management is owner-only. The page re-checks with `requireRole` and
    // RLS refuses the write regardless, this just avoids showing a screen the
    // visitor cannot use.
    if (pathname.startsWith('/admin/team') && adminUser.role !== 'owner') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Author identity/credential issuance is owner/editor-only, same as
    // publishing. The page re-checks with `requireRole` and RLS refuses the
    // write regardless.
    if (
      pathname.startsWith('/admin/authors') &&
      adminUser.role !== 'owner' &&
      adminUser.role !== 'editor'
    ) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return response;
}

/**
 * Match every route except:
 *   - static assets (_next/static, _next/image)
 *   - favicon / og assets
 *   - public image extensions
 *   - robots.txt and sitemap.xml, which must stay unprefixed
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|og/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
};
