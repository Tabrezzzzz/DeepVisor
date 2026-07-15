"use server";

// ===== AUTHENTICATION ACTIONS =====

import crypto from "node:crypto";
import { headers } from "next/headers";
import { createSupabaseClient } from "@/lib/server/supabase/server";
import { type ApiResponse } from "@/lib/shared/types/api";
import { fromSupabaseAuthError } from "@/lib/server/supabase/authError";
import type { EmailOtpType } from "@supabase/supabase-js";
import { ErrorCode } from "@/lib/shared";
import { consumeRateLimit } from "@/lib/server/security/rateLimit";
import { fail, ok } from "@/lib/shared/utils/responses";

async function getActionClientIp(): Promise<string> {
    const headerStore = await headers();
    return (
        headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headerStore.get('x-real-ip') ||
        'unknown'
    );
}

function normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
}

function hashIdentifier(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
}

async function enforceAuthActionLimit(input: {
    action: string;
    email?: string;
    ipLimit: number;
    emailLimit?: number;
}): Promise<ApiResponse<never> | null> {
    const ip = await getActionClientIp();
    const ipLimiter = await consumeRateLimit({
        identifier: `ip:${ip}`,
        action: input.action,
        limit: input.ipLimit,
        windowSeconds: 60 * 60,
    });

    if (!ipLimiter.allowed) {
        return fail('Rate limit exceeded', ErrorCode.RATE_LIMITED, {
            userMessage: 'Too many requests. Please wait and try again later.',
            details: {
                retryAfterSeconds: ipLimiter.retryAfterSeconds,
                resetAt: ipLimiter.resetAt,
            },
        });
    }

    if (input.email && input.emailLimit) {
        const emailLimiter = await consumeRateLimit({
            identifier: `email:${hashIdentifier(normalizeEmail(input.email))}`,
            action: input.action,
            limit: input.emailLimit,
            windowSeconds: 60 * 60,
        });

        if (!emailLimiter.allowed) {
            return fail('Rate limit exceeded', ErrorCode.RATE_LIMITED, {
                userMessage: 'Too many requests. Please wait and try again later.',
                details: {
                    retryAfterSeconds: emailLimiter.retryAfterSeconds,
                    resetAt: emailLimiter.resetAt,
                },
            });
        }
    }

    return null;
}

/**
 * Handles user login with email and password
 * @param email User's email
 * @param password User's password
 * @return Success status and error message if any
*/
export async function handleLogin(email: string, password: string): Promise<ApiResponse<null>> {
    try {
        const limited = await enforceAuthActionLimit({
            action: 'auth.password_login',
            email,
            ipLimit: 60,
            emailLimit: 20,
        });

        if (limited) {
            return limited;
        }

        const supabase = await createSupabaseClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            return fromSupabaseAuthError(error);
        }

        return ok(null);
    } catch (e: unknown) {
        return fromSupabaseAuthError(e);
    }
}

/**
 * Handles user signup - creates auth record but NOT profile
 * @param email User's email
 * @param password User's password
 * @param first_name User's first name
 * @param last_name User's last name
 * @param phone_number User's phone number
 * @return Success status and user ID if successful, error message otherwise
*/
export async function handleSignUp(
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    phone_number: string
): Promise<ApiResponse<{ userId: string }>> {
    try {
        const limited = await enforceAuthActionLimit({
            action: 'auth.signup',
            email,
            ipLimit: 30,
            emailLimit: 5,
        });

        if (limited) {
            return limited;
        }

        const supabase = await createSupabaseClient();

        const { data, error } = await supabase.auth.signUp({
            email,
            phone: phone_number,
            password,
            options: {
                data: {
                    first_name,
                    last_name,
                    phone_number,
                },
            },
        });
        if (error) return fromSupabaseAuthError(error);

        let userId = data.user?.id;

        if (!userId) {
            return fromSupabaseAuthError(new Error('User ID not returned after sign up'));
        }

        return ok({ userId });
    } catch (e: unknown) {
        return fromSupabaseAuthError(e);
    }
}

/**
 * Handles user sign out
 * @return Success status and error message if any
*/
export async function handleSignOut(): Promise<ApiResponse<null>> {
    try {
        const supabase = await createSupabaseClient();
        const { error } = await supabase.auth.signOut();

        // Clear platform and ad account cookies
        // DEPRECATED - we should be handling this on the client side instead of server side since these cookies are only used on the client and not needed for auth - will remove this later

        // const cookieStore = cookies();
        // (await cookieStore).set('platform_integration_id', '', { path: '/', maxAge: 0 });
        // (await cookieStore).set('ad_account_id', '', { path: '/', maxAge: 0 });

        if (error) {
            return fromSupabaseAuthError(error);
        }

        return ok(null);
    } catch (e: unknown) {
        return fromSupabaseAuthError(e);
    }
}

// ===== EMAIL VERIFICATION ACTIONS =====

/**
 * Handles email verification using the code from the email link
 * @param code Verification code from email link
 * @return Success status and error message if any
*/

export async function handleEmailVerificationFromUrl(params: {
    token_hash: string;
    type: EmailOtpType;
}): Promise<ApiResponse<null>> {
    try {
        const supabase = await createSupabaseClient();

        if (params.token_hash) {
            const tokenHash = params.token_hash;
            const type = params.type

            const { error } = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: type ?? 'signup',
            });

            if (error) {
                return fromSupabaseAuthError(error);
            }

            return ok(null);
        }

        return fromSupabaseAuthError(new Error("Missing token_hash in verification URL."));
    } catch (e: unknown) {
        return fromSupabaseAuthError(e);
    }
}

/**
 * Resends verification email
 * @param email User's email to resend verification to
 * @return Success status and error message if any
*/
export async function handleResendVerificationEmail(email: string): Promise<ApiResponse<null>> {
    try {
        const limited = await enforceAuthActionLimit({
            action: 'auth.resend_verification',
            email,
            ipLimit: 20,
            emailLimit: 3,
        });

        if (limited) {
            return limited;
        }

        const supabase = await createSupabaseClient();

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
        });

        if (error) {
            return fromSupabaseAuthError(error);
        }

        return ok(null);
    } catch (e: unknown) {
        return fromSupabaseAuthError(e);
    }
}
