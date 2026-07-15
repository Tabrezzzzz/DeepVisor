import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getForwardedOrigin } from '@/lib/server/http/origin';

const PUBLIC_ROUTES = new Set([
    '/',
    '/features',
    '/privacy',
    '/privacy-policy',
    '/terms-of-service',
]);

function normalizePathname(pathname: string): string {
    if (pathname.length > 1 && pathname.endsWith('/')) {
        return pathname.slice(0, -1);
    }

    return pathname;
}

function redirectWithSupabaseCookies(
    request: NextRequest,
    supabaseResponse: NextResponse,
    pathname: string,
    requestId: string
) {
    const url = new URL(pathname, getForwardedOrigin(request.headers, request.nextUrl.origin));
    url.search = '';
    const response = NextResponse.redirect(url);
    response.headers.set('x-request-id', requestId);

    supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, cookie);
    });

    return response;
}

function nextWithRequestId(request: NextRequest, requestId: string) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-request-id', requestId);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
    response.headers.set('x-request-id', requestId);
    return response;
}

export async function updateSession(request: NextRequest, requestId: string) {
    let supabaseResponse = nextWithRequestId(request, requestId);

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = nextWithRequestId(request, requestId);
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: DO NOT REMOVE auth.getUser()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = normalizePathname(request.nextUrl.pathname);
    const isRootPage = pathname === '/';
    const isLoginPage = pathname.startsWith('/login');
    const isSignUpPage =
        pathname.startsWith('/sign-up') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/register');
    const isPublicRoute = PUBLIC_ROUTES.has(pathname);
    const isServerActionRequest = request.headers.has('next-action');

    if (isServerActionRequest) {
        return supabaseResponse;
    }

    // Handle unauthenticated user trying to access protected routes
    if (!user && !isLoginPage && !isSignUpPage && !isPublicRoute) {
        return redirectWithSupabaseCookies(request, supabaseResponse, '/login', requestId);
    }

    // Handle authenticated user trying to access auth/public entry pages.
    // Keep this redirect local to avoid an entry-page -> API redirect bounce loop
    // if the browser retries /login while a valid session cookie is present.
    if (user && (isRootPage || isLoginPage || isSignUpPage)) {
        return redirectWithSupabaseCookies(request, supabaseResponse, '/api/auth/redirect', requestId);
    }



    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    // If you're creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse
}
