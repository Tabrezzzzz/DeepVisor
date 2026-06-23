import 'server-only';

import { GoogleAdsApi } from 'google-ads-api';
import type {
  GoogleAdsCredentials,
  GoogleAdAccountSnapshot,
  GoogleExchangeCodeInput,
  GoogleOAuthBuildInput,
  GoogleOAuthToken,
} from '@/lib/server/integrations/types';

const GOOGLE_ADS_SCOPE = 'https://www.googleapis.com/auth/adwords';
const GOOGLE_ADS_DEBUG = process.env.GOOGLE_ADS_DEBUG === '1';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function normalizeOptionalCustomerId(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = normalizeCustomerId(value);
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeCustomerId(value: string): string {
  return value.replace(/^customers\//, '').replaceAll('-', '').trim();
}

export function getEnvGoogleAdsCredentials(): GoogleAdsCredentials {
  return {
    clientId: requireEnv('GOOGLE_ADS_CLIENT_ID'),
    clientSecret: requireEnv('GOOGLE_ADS_CLIENT_SECRET'),
    developerToken: requireEnv('GOOGLE_ADS_DEVELOPER_TOKEN'),
    loginCustomerId: optionalEnv('GOOGLE_ADS_LOGIN_CUSTOMER_ID') ?? null,
    scopes: optionalEnv('GOOGLE_ADS_SCOPES') ?? GOOGLE_ADS_SCOPE,
    source: 'env',
  };
}

function resolveGoogleAdsCredentials(credentials?: GoogleAdsCredentials): GoogleAdsCredentials {
  return credentials ?? getEnvGoogleAdsCredentials();
}

function getGoogleAdsClient(credentials?: GoogleAdsCredentials): GoogleAdsApi {
  const resolved = resolveGoogleAdsCredentials(credentials);
  return new GoogleAdsApi({
    client_id: resolved.clientId,
    client_secret: resolved.clientSecret,
    developer_token: resolved.developerToken,
  });
}

export function normalizeGoogleAdsError(error: unknown, fallback = 'Google Ads API request failed'): string {
  const record = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  const details = Array.isArray(record.failure)
    ? record.failure
    : Array.isArray(record.errors)
      ? record.errors
      : null;

  if (details) {
    const messages = details
      .map((item) => {
        const errorRecord = item && typeof item === 'object' ? item as Record<string, unknown> : {};
        return typeof errorRecord.message === 'string' ? errorRecord.message : null;
      })
      .filter((message): message is string => Boolean(message));
    if (messages.length > 0) {
      return messages.join(' | ');
    }
  }

  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message;
  }

  return fallback;
}

export function toGoogleAdsUserMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('developer token')) {
    return 'Google Ads rejected the developer token. Check this workspace’s Google Ads developer token and API access level.';
  }

  if (normalized.includes('login customer') || normalized.includes('manager')) {
    return 'Google Ads rejected the manager account scope. Check the workspace login customer ID or leave it blank for direct account access.';
  }

  if (normalized.includes('permission') || normalized.includes('authorization') || normalized.includes('access')) {
    return 'Google Ads did not allow access to this account. Check account permissions and OAuth consent.';
  }

  if (normalized.includes('quota') || normalized.includes('rate')) {
    return 'Google Ads rate-limited this request. Wait a minute and retry.';
  }

  return message;
}

export function debugGoogleAds(message: string, metadata?: Record<string, unknown>): void {
  if (!GOOGLE_ADS_DEBUG) {
    return;
  }

  console.info(`[Google Ads] ${message}`, metadata ?? {});
}

export function buildGoogleOAuthUrl(input: GoogleOAuthBuildInput): URL {
  const oauthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  const credentials = resolveGoogleAdsCredentials(input.credentials);
  const scopes = credentials.scopes?.trim() || GOOGLE_ADS_SCOPE;

  oauthUrl.searchParams.set('client_id', credentials.clientId);
  oauthUrl.searchParams.set('redirect_uri', input.redirectUri);
  oauthUrl.searchParams.set('response_type', 'code');
  oauthUrl.searchParams.set('scope', scopes);
  oauthUrl.searchParams.set('state', input.state);
  oauthUrl.searchParams.set('access_type', 'offline');
  oauthUrl.searchParams.set('prompt', 'consent');
  oauthUrl.searchParams.set('include_granted_scopes', 'true');

  return oauthUrl;
}

export async function exchangeGoogleCodeForToken(
  input: GoogleExchangeCodeInput
): Promise<GoogleOAuthToken> {
  const credentials = resolveGoogleAdsCredentials(input.credentials);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      code: input.code,
      grant_type: 'authorization_code',
      redirect_uri: input.redirectUri,
    }),
  });

  const body = (await response.json().catch(() => ({}))) as GoogleOAuthToken & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok) {
    throw new Error(body.error_description || body.error || 'Failed to exchange Google OAuth code');
  }

  if (!body.access_token) {
    throw new Error('Google OAuth response did not include an access token');
  }

  return body;
}

export async function refreshGoogleAccessToken(
  refreshToken: string,
  credentials?: GoogleAdsCredentials
): Promise<GoogleOAuthToken> {
  const resolved = resolveGoogleAdsCredentials(credentials);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: resolved.clientId,
      client_secret: resolved.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const body = (await response.json().catch(() => ({}))) as GoogleOAuthToken & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok) {
    throw new Error(body.error_description || body.error || 'Failed to refresh Google access token');
  }

  if (!body.access_token) {
    throw new Error('Google refresh response did not include an access token');
  }

  return body;
}

export async function validateGoogleRefreshToken(
  refreshToken: string,
  credentials?: GoogleAdsCredentials
): Promise<void> {
  debugGoogleAds('validating refresh token');
  const customers = await getGoogleAdsClient(credentials).listAccessibleCustomers(refreshToken);
  const resourceNames = (customers as { resource_names?: string[]; resourceNames?: string[] });
  const names = resourceNames.resource_names ?? resourceNames.resourceNames ?? [];

  if (!Array.isArray(names)) {
    throw new Error('Google Ads customer lookup returned an unexpected response');
  }
}

export async function fetchGoogleAdAccountSnapshots(
  refreshToken: string,
  credentials?: GoogleAdsCredentials
): Promise<GoogleAdAccountSnapshot[]> {
  const resolved = resolveGoogleAdsCredentials(credentials);
  const client = getGoogleAdsClient(resolved);
  const response = await client.listAccessibleCustomers(refreshToken);
  const resourceNames = (response as { resource_names?: string[]; resourceNames?: string[] });
  const names = resourceNames.resource_names ?? resourceNames.resourceNames ?? [];
  const snapshots: GoogleAdAccountSnapshot[] = [];
  debugGoogleAds('fetched accessible customers', { count: names.length });

  for (const resourceName of names) {
    const customerId = normalizeCustomerId(resourceName);
    if (!customerId) continue;

    try {
      const customer = client.Customer({
        customer_id: customerId,
        refresh_token: refreshToken,
        login_customer_id: normalizeOptionalCustomerId(resolved.loginCustomerId),
      });

      const rows = await customer.query<any[]>(`
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone,
          customer.status,
          customer.manager
        FROM customer
        LIMIT 1
      `);
      const row = rows[0] ?? {};
      const googleCustomer = row.customer ?? {};

      snapshots.push({
        externalAccountId: String(googleCustomer.id ?? customerId).replaceAll('-', ''),
        name: typeof googleCustomer.descriptiveName === 'string'
          ? googleCustomer.descriptiveName
          : typeof googleCustomer.descriptive_name === 'string'
            ? googleCustomer.descriptive_name
            : `Google Ads ${customerId}`,
        status: typeof googleCustomer.status === 'string' ? googleCustomer.status.toLowerCase() : null,
        currencyCode: googleCustomer.currencyCode ?? googleCustomer.currency_code ?? null,
        timezone: googleCustomer.timeZone ?? googleCustomer.time_zone ?? null,
        isManager: typeof googleCustomer.manager === 'boolean' ? googleCustomer.manager : null,
      });
    } catch (error) {
      debugGoogleAds('failed to fetch customer details, keeping discovered account', {
        customerId,
        message: normalizeGoogleAdsError(error),
      });
      snapshots.push({
        externalAccountId: customerId,
        name: `Google Ads ${customerId}`,
        status: 'discovered',
        currencyCode: null,
        timezone: null,
        isManager: null,
      });
    }
  }

  return snapshots;
}

export function createGoogleAdsCustomer(input: {
  customerId: string;
  refreshToken: string;
  credentials?: GoogleAdsCredentials;
}) {
  const credentials = resolveGoogleAdsCredentials(input.credentials);
  return getGoogleAdsClient(credentials).Customer({
    customer_id: normalizeCustomerId(input.customerId),
    refresh_token: input.refreshToken,
    login_customer_id: normalizeOptionalCustomerId(credentials.loginCustomerId),
  });
}
