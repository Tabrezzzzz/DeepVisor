import { NextRequest, NextResponse } from 'next/server';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { consumeRateLimit, rateLimitResponse } from '@/lib/server/security/rateLimit';
import { createAdminClient } from '@/lib/server/supabase/admin';
import { buildGlobalAiAssistantPayload } from '@/lib/server/intelligence';
import { answerAssistantQuestion } from '@/lib/server/intelligence/assistant/service';
import { buildDecisionSupportContext } from '@/lib/server/intelligence/decisionSupportContext';

type AssistantBody = {
  question?: string;
  platformIntegrationId?: string | null;
  adAccountId?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const { businessId, user } = await getRequiredAppContext();
    const limiter = await consumeRateLimit({
      identifier: `user:${user.id}:business:${businessId}`,
      action: 'ai.assistant',
      limit: 60,
      windowSeconds: 60 * 60,
    });

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    const body = (await request.json().catch(() => ({}))) as AssistantBody;
    const question = body.question?.trim();

    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Ask a question first.' },
        { status: 400 }
      );
    }

    const payload = await buildGlobalAiAssistantPayload({
      businessId,
      defaultPlatformIntegrationId: body.platformIntegrationId ?? null,
      defaultAdAccountId: body.adAccountId ?? null,
    });

    if (!payload.selectedAdAccountId) {
      return NextResponse.json(
        { success: false, error: 'Select an ad account first.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const decisionSupportContext = await buildDecisionSupportContext(supabase, {
      businessId,
      adAccountId: payload.selectedAdAccountId,
      latestAssessment: payload.latestSelectedAssessment,
    });
    const answer = await answerAssistantQuestion({
      supabase,
      businessId,
      adAccountId: payload.selectedAdAccountId,
      question,
      latestSelectedAssessment: payload.latestSelectedAssessment,
      decisionSupportContext,
    });

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error('Failed to answer assistant question:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to answer question.' },
      { status: 500 }
    );
  }
}
