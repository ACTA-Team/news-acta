import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/database.types';
import { hasSupabasePublicEnv, supabaseEnv } from '@/lib/supabase/env';

export async function proxy(request: NextRequest) {
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

  const { data } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  const isAdminPath = pathname.startsWith('/admin');
  const isAdminLogin = pathname === '/admin/login';

  if (isAdminPath && !isAdminLogin) {
    const user = data.user;
    if (!user?.email) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    if (user.app_metadata?.provider !== 'email') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', user.email.toLowerCase())
      .maybeSingle();

    if (!adminUser) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return response;
}

/**
 * Match every route except:
 *   - static assets (_next/static, _next/image)
 *   - favicon / og assets
 *   - public image extensions
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|og/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
