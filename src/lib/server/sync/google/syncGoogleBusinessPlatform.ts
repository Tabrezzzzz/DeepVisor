import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createGoogleAdsCustomer,
  debugGoogleAds,
  normalizeGoogleAdsError,
} from '@/lib/server/integrations/adapters/google';
import type { GoogleAdsCredentials } from '@/lib/server/integrations/types';
import { upsertAdCreatives } from '@/lib/server/repositories/ad_creatives/upsertAdCreatives';
import { upsertAdEntities } from '@/lib/server/repositories/ad_entities/upsertAdEntities';
import { upsertAdEntityPerformanceDaily } from '@/lib/server/repositories/ad_entities/upsertAdEntityPerformanceDaily';
import { refreshAdEntityPerformanceSummaries } from '@/lib/server/repositories/ad_entities/refreshAdEntityPerformanceSummaries';
import { resolveRequestedSyncWindow } from '@/lib/server/repositories/ad_accounts/syncState';
import type { AdEntityRow } from '@/lib/server/repositories/ad_entities/types';
import type { BusinessPlatformSyncCounts } from '@/lib/server/sync/types';
import type { Database } from '@/lib/shared/types/supabase';

type AppSupabaseClient = SupabaseClient<Database>;

type GoogleRow = Record<string, any>;

export type GooglePlatformSyncResult = BusinessPlatformSyncCounts & {
  coverageStartDate: string | null;
  coverageEndDate: string | null;
};

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function microsToCurrency(value: unknown): number {
  return toNumber(value) / 1_000_000;
}

function normalizeStatus(value: unknown): string | null {
  const status = toStringOrNull(value);
  return status ? status.toLowerCase() : null;
}

function rowCampaign(row: GoogleRow): GoogleRow {
  return row.campaign ?? {};
}

function rowAdGroup(row: GoogleRow): GoogleRow {
  return row.adGroup ?? row.ad_group ?? {};
}

function rowAdGroupAd(row: GoogleRow): GoogleRow {
  return row.adGroupAd ?? row.ad_group_ad ?? {};
}

function rowAd(row: GoogleRow): GoogleRow {
  return rowAdGroupAd(row).ad ?? {};
}

function rowMetrics(row: GoogleRow): GoogleRow {
  return row.metrics ?? {};
}

function rowSegments(row: GoogleRow): GoogleRow {
  return row.segments ?? {};
}

function entityMap(rows: AdEntityRow[]): Map<string, AdEntityRow> {
  return new Map(rows.map((row) => [row.external_id, row]));
}

function isTransientGoogleError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('temporarily') ||
    normalized.includes('timeout') ||
    normalized.includes('unavailable') ||
    normalized.includes('rate') ||
    normalized.includes('quota') ||
    normalized.includes('retry')
  );
}

async function queryGoogleAds<T>(
  label: string,
  execute: () => Promise<T>,
  attempt = 1
): Promise<T> {
  try {
    debugGoogleAds(`query start: ${label}`, { attempt });
    const result = await execute();
    debugGoogleAds(`query complete: ${label}`, {
      attempt,
      count: Array.isArray(result) ? result.length : undefined,
    });
    return result;
  } catch (error) {
    const message = normalizeGoogleAdsError(error);
    if (attempt < 3 && isTransientGoogleError(message)) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 750));
      return queryGoogleAds(label, execute, attempt + 1);
    }

    throw new Error(message);
  }
}

async function loadAdAccount(input: {
  supabase: AppSupabaseClient;
  businessId: string;
  platformId: string;
  externalAccountId: string;
}) {
  const { data, error } = await input.supabase
    .from('ad_accounts')
    .select('id, currency_code')
    .eq('business_id', input.businessId)
    .eq('platform_id', input.platformId)
    .eq('external_account_id', input.externalAccountId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) throw new Error('Selected Google Ads account is not registered');
  return data;
}

export async function syncGoogleBusinessPlatform(input: {
  supabase: AppSupabaseClient;
  businessId: string;
  platformId: string;
  platformIntegrationId: string;
  refreshToken: string;
  credentials?: GoogleAdsCredentials;
  primaryExternalAccountId: string;
  backfillDays: number;
  syncedAt: string;
}): Promise<GooglePlatformSyncResult> {
  const adAccount = await loadAdAccount({
    supabase: input.supabase,
    businessId: input.businessId,
    platformId: input.platformId,
    externalAccountId: input.primaryExternalAccountId,
  });
  const { requestedStartDate, requestedEndDate } = resolveRequestedSyncWindow(input.backfillDays);
  const customer = createGoogleAdsCustomer({
    customerId: input.primaryExternalAccountId,
    refreshToken: input.refreshToken,
    credentials: input.credentials,
  });

  const campaignRows = await queryGoogleAds('campaigns', () => customer.query<GoogleRow[]>(`
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.advertising_channel_sub_type,
      campaign.start_date,
      campaign.end_date
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  `));

  const campaigns = await upsertAdEntities(
    input.supabase,
    campaignRows.map((row) => {
      const campaign = rowCampaign(row);
      return {
        businessId: input.businessId,
        adAccountId: adAccount.id,
        platformId: input.platformId,
        platformIntegrationId: input.platformIntegrationId,
        entityLevel: 'campaign',
        externalId: String(campaign.id),
        name: toStringOrNull(campaign.name),
        objective: toStringOrNull(campaign.advertisingChannelType ?? campaign.advertising_channel_type),
        optimizationGoal: toStringOrNull(
          campaign.advertisingChannelSubType ?? campaign.advertising_channel_sub_type
        ),
        status: normalizeStatus(campaign.status),
        raw: row,
        syncedAt: input.syncedAt,
      };
    })
  );
  const campaignByExternalId = entityMap(campaigns);

  const adGroupRows = await queryGoogleAds('ad groups', () => customer.query<GoogleRow[]>(`
    SELECT
      campaign.id,
      ad_group.id,
      ad_group.name,
      ad_group.status,
      ad_group.type
    FROM ad_group
    WHERE ad_group.status != 'REMOVED'
  `));

  const adsets = await upsertAdEntities(
    input.supabase,
    adGroupRows.map((row) => {
      const campaign = rowCampaign(row);
      const adGroup = rowAdGroup(row);
      const campaignExternalId = String(campaign.id);
      const campaignEntity = campaignByExternalId.get(campaignExternalId);

      return {
        businessId: input.businessId,
        adAccountId: adAccount.id,
        platformId: input.platformId,
        platformIntegrationId: input.platformIntegrationId,
        entityLevel: 'adset',
        externalId: String(adGroup.id),
        parentId: campaignEntity?.id ?? null,
        parentExternalId: campaignExternalId,
        campaignId: campaignEntity?.id ?? null,
        name: toStringOrNull(adGroup.name),
        optimizationGoal: toStringOrNull(adGroup.type),
        status: normalizeStatus(adGroup.status),
        raw: row,
        syncedAt: input.syncedAt,
      };
    })
  );
  const adsetByExternalId = entityMap(adsets);

  const adRows = await queryGoogleAds('ads', () => customer.query<GoogleRow[]>(`
    SELECT
      campaign.id,
      ad_group.id,
      ad_group_ad.ad.id,
      ad_group_ad.ad.name,
      ad_group_ad.status,
      ad_group_ad.ad.type,
      ad_group_ad.ad.final_urls,
      ad_group_ad.ad.responsive_search_ad.headlines,
      ad_group_ad.ad.responsive_search_ad.descriptions,
      ad_group_ad.ad.image_ad.image_url,
      ad_group_ad.ad.video_ad.video.asset
    FROM ad_group_ad
    WHERE ad_group_ad.status != 'REMOVED'
  `));

  const ads = await upsertAdEntities(
    input.supabase,
    adRows.map((row) => {
      const campaign = rowCampaign(row);
      const adGroup = rowAdGroup(row);
      const ad = rowAd(row);
      const adGroupAd = rowAdGroupAd(row);
      const campaignExternalId = String(campaign.id);
      const adsetExternalId = String(adGroup.id);
      const campaignEntity = campaignByExternalId.get(campaignExternalId);
      const adsetEntity = adsetByExternalId.get(adsetExternalId);

      return {
        businessId: input.businessId,
        adAccountId: adAccount.id,
        platformId: input.platformId,
        platformIntegrationId: input.platformIntegrationId,
        entityLevel: 'ad',
        externalId: String(ad.id),
        parentId: adsetEntity?.id ?? null,
        parentExternalId: adsetExternalId,
        campaignId: campaignEntity?.id ?? null,
        adsetId: adsetEntity?.id ?? null,
        name: toStringOrNull(ad.name) ?? `Google Ad ${ad.id}`,
        creativeExternalId: String(ad.id),
        status: normalizeStatus(adGroupAd.status),
        optimizationGoal: toStringOrNull(ad.type),
        raw: row,
        syncedAt: input.syncedAt,
      };
    })
  );

  const creativeRows = await upsertAdCreatives(
    input.supabase,
    adRows.map((row) => {
      const ad = rowAd(row);
      const adId = String(ad.id);
      const responsiveSearchAd = ad.responsiveSearchAd ?? ad.responsive_search_ad ?? {};
      const imageAd = ad.imageAd ?? ad.image_ad ?? {};
      const videoAd = ad.videoAd ?? ad.video_ad ?? {};
      const headline = Array.isArray(responsiveSearchAd.headlines)
        ? responsiveSearchAd.headlines
            .map((item: Record<string, unknown>) => toStringOrNull(item.text))
            .filter(Boolean)
            .join(' | ')
        : null;
      const description = Array.isArray(responsiveSearchAd.descriptions)
        ? responsiveSearchAd.descriptions
            .map((item: Record<string, unknown>) => toStringOrNull(item.text))
            .filter(Boolean)
            .join(' | ')
        : null;
      const finalUrls = Array.isArray(ad.finalUrls ?? ad.final_urls)
        ? (ad.finalUrls ?? ad.final_urls)
        : [];

      return {
        businessId: input.businessId,
        platformIntegrationId: input.platformIntegrationId,
        adAccountId: adAccount.id,
        platformCreativeId: adId,
        name: toStringOrNull(ad.name) ?? `Google Ad ${adId}`,
        creativeType: toStringOrNull(ad.type),
        ctaType: null,
        primaryText: null,
        headline,
        description,
        linkUrl: typeof finalUrls[0] === 'string' ? finalUrls[0] : null,
        imageUrl: toStringOrNull(imageAd.imageUrl ?? imageAd.image_url),
        imageHash: null,
        thumbnailUrl: null,
        videoId: toStringOrNull(videoAd.video?.asset ?? videoAd.video_asset),
        pageId: null,
        instagramActorId: null,
        objectStoryId: null,
        objectStorySpec: {},
        assetFeedSpec: {
          responsiveSearchAd,
          imageAd,
          videoAd,
        },
        raw: row,
        syncedAt: input.syncedAt,
      };
    })
  );

  const allEntities = [...campaigns, ...adsets, ...ads];
  const entityByLevelAndExternalId = new Map(
    allEntities.map((entity) => [`${entity.entity_level}:${entity.external_id}`, entity])
  );

  async function syncDailyMetrics(entityLevel: 'campaign' | 'adset' | 'ad', query: string) {
    const rows = await queryGoogleAds(`${entityLevel} daily metrics`, () => customer.query<GoogleRow[]>(query));
    const result = await upsertAdEntityPerformanceDaily(
      input.supabase,
      rows.map((row) => {
        const campaign = rowCampaign(row);
        const adGroup = rowAdGroup(row);
        const ad = rowAd(row);
        const metrics = rowMetrics(row);
        const segments = rowSegments(row);
        const externalId =
          entityLevel === 'campaign'
            ? String(campaign.id)
            : entityLevel === 'adset'
              ? String(adGroup.id)
              : String(ad.id);
        const entity = entityByLevelAndExternalId.get(`${entityLevel}:${externalId}`);

        return {
          entityId: entity?.id ?? '',
          adAccountId: adAccount.id,
          entityLevel,
          day: String(segments.date),
          currencyCode: adAccount.currency_code,
          objective: entity?.objective ?? null,
          source: 'google_ads_api',
          status: entity?.status ?? null,
          spend: microsToCurrency(metrics.costMicros ?? metrics.cost_micros),
          reach: 0,
          impressions: toNumber(metrics.impressions),
          clicks: toNumber(metrics.clicks),
          inlineLinkClicks: toNumber(metrics.clicks),
          leads: toNumber(metrics.conversions ?? metrics.allConversions ?? metrics.all_conversions),
          messages: 0,
          calls: 0,
          syncedAt: input.syncedAt,
        };
      })
    );

    return result.count;
  }

  const campaignPerformanceRows = await syncDailyMetrics('campaign', `
    SELECT
      segments.date,
      campaign.id,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.all_conversions,
      metrics.conversions_value,
      metrics.all_conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${requestedStartDate}' AND '${requestedEndDate}'
  `);

  const adsetPerformanceRows = await syncDailyMetrics('adset', `
    SELECT
      segments.date,
      ad_group.id,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.all_conversions,
      metrics.conversions_value,
      metrics.all_conversions_value
    FROM ad_group
    WHERE segments.date BETWEEN '${requestedStartDate}' AND '${requestedEndDate}'
  `);

  const adPerformanceRows = await syncDailyMetrics('ad', `
    SELECT
      segments.date,
      ad_group_ad.ad.id,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.all_conversions,
      metrics.conversions_value,
      metrics.all_conversions_value
    FROM ad_group_ad
    WHERE segments.date BETWEEN '${requestedStartDate}' AND '${requestedEndDate}'
  `);

  const campaignSummary = await refreshAdEntityPerformanceSummaries(input.supabase, {
    entities: campaigns,
    syncedAt: input.syncedAt,
  });
  const adsetSummary = await refreshAdEntityPerformanceSummaries(input.supabase, {
    entities: adsets,
    syncedAt: input.syncedAt,
  });
  const adSummary = await refreshAdEntityPerformanceSummaries(input.supabase, {
    entities: ads,
    syncedAt: input.syncedAt,
  });

  await input.supabase
    .from('ad_accounts')
    .update({
      last_synced: input.syncedAt,
      updated_at: input.syncedAt,
    })
    .eq('id', adAccount.id);

  await input.supabase
    .from('ad_account_sync_state')
    .update({
      dimensions_synced_at: input.syncedAt,
      first_full_sync_completed: true,
      first_full_sync_at: input.syncedAt,
      historical_data_available:
        campaignPerformanceRows + adsetPerformanceRows + adPerformanceRows > 0,
      has_meaningful_history:
        campaignPerformanceRows + adsetPerformanceRows + adPerformanceRows > 0,
      first_activity_date: requestedStartDate,
      latest_activity_date: requestedEndDate,
      insights_synced_through: requestedEndDate,
      updated_at: input.syncedAt,
    })
    .eq('ad_account_id', adAccount.id);

  return {
    coverageStartDate: requestedStartDate,
    coverageEndDate: requestedEndDate,
    adAccounts: 1,
    campaignDims: campaigns.length,
    adsetDims: adsets.length,
    adDims: ads.length,
    adCreatives: creativeRows.count,
    creativeFeatureSnapshots: 0,
    adAccountPerformanceRows: 0,
    campaignPerformanceRows,
    adsetPerformanceRows,
    adPerformanceRows,
    metaHourlyPerformanceRows: 0,
    campaignPerformanceSummaries: campaignSummary.count,
    adsetPerformanceSummaries: adsetSummary.count,
    adPerformanceSummaries: adSummary.count,
  };
}
