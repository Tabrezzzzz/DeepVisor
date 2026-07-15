import { createSupabaseClient } from "@/lib/server/supabase/server";
import { resolvePostAuthRedirectPath } from "@/lib/server/auth/postAuthRedirect";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { consumeRateLimit, getClientIp, rateLimitResponse } from "@/lib/server/security/rateLimit";

const ALLOWED_OTP_TYPES = new Set<EmailOtpType>([
    'signup',
    'invite',
    'magiclink',
    'recovery',
    'email_change',
    'email',
]);

function parseOtpType(value: string | null): EmailOtpType | null {
    if (!value) {
        return 'signup';
    }

    return ALLOWED_OTP_TYPES.has(value as EmailOtpType) ? (value as EmailOtpType) : null;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const limiter = await consumeRateLimit({
        identifier: `ip:${getClientIp(request)}`,
        action: 'auth.email_verification',
        limit: 60,
        windowSeconds: 60 * 60,
    });

    if (!limiter.allowed) {
        return rateLimitResponse(limiter);
    }

    const token_hash = searchParams.get('token_hash');
    const type = parseOtpType(searchParams.get('type'));

    if (!token_hash || !type) {
        return NextResponse.redirect(new URL('/login?error=missing_verification_params', request.url));
    }

    const supabase = await createSupabaseClient();

    const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type,
    })

    if (error) {
        return NextResponse.redirect(new URL('/login?error=verification_failed', request.url));
    }

    const userId = data.user?.id;
    if (!userId) {
        return NextResponse.redirect(new URL('/login?error=verification_failed', request.url));
    }

    const redirectPath = await resolvePostAuthRedirectPath(userId);
    return NextResponse.redirect(new URL(redirectPath, request.url));
}
