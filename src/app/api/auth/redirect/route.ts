import { NextResponse, type NextRequest } from 'next/server';
import { resolvePostAuthRedirectPath } from '@/lib/server/auth/postAuthRedirect';
import { createSupabaseClient } from '@/lib/server/supabase/server';
import { getForwardedOrigin } from '@/lib/server/http/origin';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = getForwardedOrigin(request.headers, requestUrl.origin);
  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  try {
    const redirectPath = await resolvePostAuthRedirectPath(user.id);
    return NextResponse.redirect(new URL(redirectPath, origin));
  } catch (redirectError) {
    console.error('Failed to resolve post-auth redirect:', redirectError);
    return NextResponse.redirect(new URL('/onboarding', origin));
  }
}
