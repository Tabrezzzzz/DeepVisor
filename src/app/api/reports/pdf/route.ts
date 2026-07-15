import { NextRequest, NextResponse } from 'next/server';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import { consumeRateLimit, rateLimitResponse } from '@/lib/server/security/rateLimit';
import { createAdminClient } from '@/lib/server/supabase/admin';
import { parseReportQueryInput } from '@/lib/server/reports/query';
import { renderReportPdfBuffer } from '@/lib/server/reports/pdf/renderReportPdf';

export const runtime = 'nodejs';

function isTruthySearchParam(value: string | null): boolean {
  return value === '1' || value === 'true' || value === 'yes';
}

export async function GET(request: NextRequest) {
  try {
    const context = await getRequiredAppContext(false);
    const limiter = await consumeRateLimit({
      identifier: `user:${context.user.id}:business:${context.businessId}`,
      action: 'report.pdf',
      limit: 20,
      windowSeconds: 60 * 60,
    });

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    const query = parseReportQueryInput(
      context.businessId,
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    const { buffer, fileName } = await renderReportPdfBuffer({
      query,
      organizationName: context.organizationName,
      demo: isTruthySearchParam(request.nextUrl.searchParams.get('demo')),
    });
    await logAuditEvent(createAdminClient(), {
      businessId: context.businessId,
      organizationId: context.organizationId,
      actorUserId: context.user.id,
      eventType: 'report.exported',
      resourceType: 'report',
      resourceId: 'pdf',
      metadata: {
        format: 'pdf',
        scope: query.scope,
        rangeMode: query.rangeMode,
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request.headers.get('user-agent'),
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Failed to export report PDF:', error);

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to export report PDF',
      },
      { status: 500 }
    );
  }
}
