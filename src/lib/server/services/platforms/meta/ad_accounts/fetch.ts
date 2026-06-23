import 'server-only';

import { FacebookAdsApi } from '@/lib/server/sdk/client';
import type { AdAccountDetails } from '../types';

type MetaBusiness = {
  id: string;
  name?: string;
};

type MetaAdAccountsResponse = {
  data?: AdAccountDetails[];
  paging?: {
    next?: string;
  };
  error?: {
    message?: string;
  };
};

type MetaBusinessesResponse = {
  data?: MetaBusiness[];
  paging?: {
    next?: string;
  };
  error?: {
    message?: string;
  };
};

function adAccountFields(): string {
  return [
    'id',
    'name',
    'account_status',
    'currency',
    'timezone_name',
  ].join(',');
}

async function fetchMetaCollection<T extends { id: string }>(
  path: string,
  accessToken: string,
  fields: string
): Promise<T[]> {
  let nextUrl: URL | null = new URL(`https://graph.facebook.com/v23.0/${path}`);
  nextUrl.searchParams.set('fields', [
    fields,
  ].join(','));
  nextUrl.searchParams.set('limit', '200');
  nextUrl.searchParams.set('access_token', accessToken);

  const rows: T[] = [];

  while (nextUrl) {
    const response = await fetch(nextUrl);
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as MetaAdAccountsResponse | MetaBusinessesResponse;
      throw new Error(body.error?.message || `Failed to fetch Meta collection at ${path}`);
    }

    const body = (await response.json()) as { data?: T[]; paging?: { next?: string } };
    rows.push(...(body.data ?? []));
    nextUrl = body.paging?.next ? new URL(body.paging.next) : null;
  }

  return rows;
}

async function fetchAllMetaAdAccountDetails(accessToken: string): Promise<AdAccountDetails[]> {
  const rowsById = new Map<string, AdAccountDetails>();
  const errors: string[] = [];

  async function collect(path: string) {
    try {
      const rows = await fetchMetaCollection<AdAccountDetails>(path, accessToken, adAccountFields());
      rows.forEach((row) => rowsById.set(row.id, row));
    } catch (error) {
      errors.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  await collect('me/adaccounts');

  if (rowsById.size === 0) {
    try {
      const businesses = await fetchMetaCollection<MetaBusiness>('me/businesses', accessToken, 'id,name');
      for (const business of businesses) {
        await collect(`${business.id}/owned_ad_accounts`);
        await collect(`${business.id}/client_ad_accounts`);
      }
    } catch (error) {
      errors.push(`me/businesses: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const rows = Array.from(rowsById.values());
  if (rows.length === 0 && errors.length > 0) {
    throw new Error(`Failed to fetch Meta ad accounts. ${errors.join(' | ')}`);
  }

  return rows;
}

async function fetchMetaAdAccountDetail(
  accessToken: string,
  adAccountId: string
): Promise<AdAccountDetails> {
  const url = new URL(`https://graph.facebook.com/v23.0/${adAccountId}`);
  url.searchParams.set('fields', adAccountFields());
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url);
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as MetaAdAccountsResponse;
    throw new Error(body.error?.message || `Failed to fetch Meta ad account ${adAccountId}`);
  }

  return (await response.json()) as AdAccountDetails;
}

export async function fetchMetaAdAccounts(
  accessToken: string,
  adAccountId?: string
): Promise<AdAccountDetails | AdAccountDetails[]> {
  FacebookAdsApi.init(accessToken);

  if (adAccountId) {
    return fetchMetaAdAccountDetail(accessToken, adAccountId);
  }

  return fetchAllMetaAdAccountDetails(accessToken);
}
