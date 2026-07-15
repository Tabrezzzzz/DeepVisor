import { chunkArray, dedupeBy, type RepositoryClient } from '../utils';
import type { AdEntityLevel } from './types';

export type UpsertAdEntityPerformanceDailyInput = {
  entityId: string;
  adAccountId: string;
  entityLevel: AdEntityLevel;
  day: string;
  currencyCode: string | null;
  objective: string | null;
  source: string | null;
  status: string | null;
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  inlineLinkClicks: number;
  leads: number;
  messages: number;
  calls: number;
  conversions?: number;
  allConversions?: number;
  conversionValue?: number;
  allConversionValue?: number;
  searchImpressionShare?: number | null;
  searchBudgetLostImpressionShare?: number | null;
  searchRankLostImpressionShare?: number | null;
  syncedAt: string;
};

type DailyRow = {
  entity_id: string;
  ad_account_id: string;
  entity_level: AdEntityLevel;
  day: string;
  currency_code: string | null;
  objective: string | null;
  source: string;
  status: string | null;
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  inline_link_clicks: number;
  leads: number;
  messages: number;
  calls: number;
  conversions: number;
  all_conversions: number;
  conversion_value: number;
  all_conversion_value: number;
  search_impression_share: number | null;
  search_budget_lost_impression_share: number | null;
  search_rank_lost_impression_share: number | null;
  updated_at: string;
};

export async function upsertAdEntityPerformanceDaily(
  supabase: RepositoryClient,
  inputs: UpsertAdEntityPerformanceDailyInput[]
): Promise<{ count: number }> {
  const rows = dedupeBy(
    inputs.filter((input) => input.entityId && input.adAccountId && input.day),
    (input) => `${input.entityId}::${input.day}`
  ).map(
    (input) =>
      ({
        entity_id: input.entityId,
        ad_account_id: input.adAccountId,
        entity_level: input.entityLevel,
        day: input.day,
        currency_code: input.currencyCode,
        objective: input.objective,
        source: input.source ?? 'api',
        status: input.status,
        spend: input.spend,
        reach: input.reach,
        impressions: input.impressions,
        clicks: input.clicks,
        inline_link_clicks: input.inlineLinkClicks,
        leads: input.leads,
        messages: input.messages,
        calls: input.calls,
        conversions: input.conversions ?? input.leads,
        all_conversions: input.allConversions ?? input.leads,
        conversion_value: input.conversionValue ?? 0,
        all_conversion_value: input.allConversionValue ?? input.conversionValue ?? 0,
        search_impression_share: input.searchImpressionShare ?? null,
        search_budget_lost_impression_share: input.searchBudgetLostImpressionShare ?? null,
        search_rank_lost_impression_share: input.searchRankLostImpressionShare ?? null,
        updated_at: input.syncedAt,
      }) satisfies DailyRow
  );

  if (rows.length === 0) {
    return { count: 0 };
  }

  const client = supabase as any;

  for (const chunk of chunkArray(rows, 500)) {
    const { error } = await client
      .from('ad_entity_performance_daily')
      .upsert(chunk, { onConflict: 'entity_id,day' });

    if (error) {
      throw error;
    }
  }

  return { count: rows.length };
}
