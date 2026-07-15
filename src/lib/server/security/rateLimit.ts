import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/server/supabase/admin';
import { asRecord } from '@/lib/shared';

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: string | null;
};

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function consumeRateLimit(input: {
  identifier: string;
  action: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const supabase = createAdminClient();
  const { data, error } = await (supabase as any).rpc('consume_api_rate_limit', {
    p_identifier: input.identifier,
    p_action: input.action,
    p_limit: input.limit,
    p_window_seconds: input.windowSeconds,
  });

  if (error) {
    throw error;
  }

  const payload = asRecord(data);
  return {
    allowed: payload.allowed === true,
    limit: typeof payload.limit === 'number' ? payload.limit : input.limit,
    remaining: typeof payload.remaining === 'number' ? payload.remaining : 0,
    retryAfterSeconds:
      typeof payload.retryAfterSeconds === 'number' ? payload.retryAfterSeconds : input.windowSeconds,
    resetAt: typeof payload.resetAt === 'string' ? payload.resetAt : null,
  };
}

export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      retryAfterSeconds: result.retryAfterSeconds,
      resetAt: result.resetAt,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSeconds),
      },
    }
  );
}
