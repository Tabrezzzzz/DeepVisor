import { Suspense } from 'react';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { resolveCurrentSelection } from '@/lib/server/actions/app/selection';
import { buildReportPayload, getReportFilterOptions } from '@/lib/server/repositories/reports/buildReportPayload';
import { parseReportQueryInput } from '@/lib/server/reports/query';
import type { ReportQueryInput } from '@/lib/server/reports/types';
import ReportsClientFallback from './components/ReportClientFallback';
import { ReportsClient } from './components/ReportsClient';

export const dynamic = 'force-dynamic';

type ReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function hasEntityScope(params: Record<string, string | string[] | undefined>) {
  return Boolean(
    params.platform_integration_id ||
      params.ad_account_id ||
      params.campaign_id ||
      params.adset_id ||
      params.ad_id
  );
}

function scopeReportToCurrentSelection(
  query: ReportQueryInput,
  selection: {
    selectedPlatformId: string | null;
    selectedAdAccountId: string | null;
  },
  params: Record<string, string | string[] | undefined>
): ReportQueryInput {
  if (hasEntityScope(params)) {
    return query;
  }

  if (selection.selectedPlatformId && selection.selectedAdAccountId) {
    return {
      ...query,
      scope: 'ad_account',
      platformIntegrationId: selection.selectedPlatformId,
      adAccountIds: [selection.selectedAdAccountId],
      campaignIds: [],
      adsetIds: [],
      adIds: [],
    };
  }

  return {
    ...query,
    scope: 'ad_account',
    platformIntegrationId: null,
    adAccountIds: [],
    campaignIds: [],
    adsetIds: [],
    adIds: [],
  };
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = (await searchParams) ?? {};
  const { businessId } = await getRequiredAppContext();
  const selection = await resolveCurrentSelection(businessId);
  const query = scopeReportToCurrentSelection(
    parseReportQueryInput(businessId, params),
    selection,
    params
  );
  const [payload, filterOptions] = await Promise.all([
    buildReportPayload(query),
    getReportFilterOptions(query),
  ]);

  return (
    <Suspense fallback={<ReportsClientFallback />}>
      <ReportsClient payload={payload} filterOptions={filterOptions} />
    </Suspense>
  );
}
