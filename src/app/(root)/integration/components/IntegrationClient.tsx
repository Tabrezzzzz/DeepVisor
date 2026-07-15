'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Image as MantineImage,
  LoadingOverlay,
  Menu,
  Modal,
  Paper,
  PasswordInput,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  AlertTriangle as IconAlertTriangle,
  ArrowUpRight as IconArrowUpRight,
  Check as IconCheck,
  Clock3 as IconClock,
  Link as IconLink,
  Lock as IconLock,
  RefreshCw as IconRefresh,
  Settings as IconSettings,
  Trash2 as IconTrash,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import MetaIntegrationFlow from '@/components/integrations/MetaIntegrationFlow';
import {
  clearPitchDetachedPlatform,
  readPitchDetachedPlatforms,
  upsertPitchDetachedPlatform,
  type PitchDetachedPlatform,
} from '@/components/integrations/pitchDetach';
import { getPlatformIcon } from '@/components/utils/utils';
import {
  formatDateTime,
  formatRelativeTime,
  formatRetryDelay,
  getIntegrationAvailabilityCopy,
  getIntegrationPlatformImage,
  getIntegrationPlatformPalette,
  getIntegrationStatusColor,
  getIntegrationStatusLabel,
  integrationNeedsAttention,
  isIntegrationConnected,
  sortIntegrationPlatforms,
} from '@/lib/shared';
import type { IntegrationStatus } from '@/lib/shared/types/integrations';
import styles from './IntegrationClient.module.css';

type Platform = {
  id: string;
  platformKey: string;
  platformName: string;
  description: string | null;
  fullDescription: string | null;
  strengths: string | null;
  weaknesses: string | null;
  imageUrl: string | null;
  status: IntegrationStatus;
  integrationId: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
  connectedAt: string | null;
  disconnectedAt: string | null;
  updatedAt: string | null;
  primaryAdAccountExternalId: string | null;
  primaryAdAccountName: string | null;
  discoveredAdAccountCount: number;
};

type DisplayPlatform = Platform & {
  pitchDetached: boolean;
};

type PlatformListProps = {
  platforms: Platform[];
};

type MetaAccountOption = {
  value: string;
  label: string;
};

type MetaAccountListResponse = {
  success?: boolean;
  data?: {
    accounts?: Array<{ externalAccountId: string; name: string | null; status: string | null }>;
    primaryAdAccountExternalId?: string | null;
  };
  error?: {
    userMessage?: string;
  };
};

type MetaSelectResponse = {
  success?: boolean;
  data?: {
    firstSyncJob?: { jobId?: string } | null;
  };
  error?: {
    userMessage?: string;
  };
};

type GoogleCredentialStatus = {
  configured: boolean;
  mode: 'app' | 'workspace';
  source: 'workspace' | 'env' | 'missing';
  clientIdConfigured: boolean;
  clientSecretConfigured: boolean;
  developerTokenConfigured: boolean;
  loginCustomerId: string | null;
  scopes: string | null;
  updatedAt: string | null;
};

type GoogleCredentialResponse = {
  success?: boolean;
  data?: GoogleCredentialStatus;
  error?: {
    userMessage?: string;
  };
};

type GoogleDiagnosticsResponse = {
  success?: boolean;
  data?: {
    credentials?: GoogleCredentialStatus;
    dbHealth?: { ok: boolean; checks?: Array<{ object: string; ok: boolean; message: string | null }> };
    integration?: {
      id: string;
      status: string;
      selectedAccount?: { externalAccountId?: string | null; name?: string | null } | null;
    } | null;
    refreshToken?: { present: boolean; valid: boolean; message?: string | null };
    accessibleAccounts?: {
      ok: boolean;
      count: number;
      accounts: Array<{ externalAccountId: string; name: string | null; status: string | null }>;
      message: string | null;
    };
  };
  error?: {
    userMessage?: string;
  };
};

type SearchDrivenFlow = {
  integration: string | null;
  status: string | null;
  requiresAccountSelection: boolean;
  integrationId: string | null;
  externalAccountId: string | null;
  autoSync: boolean;
};

function readFlowState(searchParams: { get: (key: string) => string | null }): SearchDrivenFlow {
  return {
    integration: searchParams.get('integration'),
    status: searchParams.get('status'),
    requiresAccountSelection: searchParams.get('requires_account_selection') === '1',
    integrationId: searchParams.get('integrationId'),
    externalAccountId: searchParams.get('externalAccountId'),
    autoSync: searchParams.get('auto_sync') === '1',
  };
}

/**
 * Shared summary card used in the integrations page hero for workspace-level counts and status.
 */
function SummaryCard({
  label,
  title,
  detail,
  accent,
}: {
  label: string;
  title: string;
  detail: string;
  accent: string;
}) {
  return (
    <Paper withBorder radius="xl" p="lg" className={styles.summaryCard}>
      <div className={styles.summaryAccent} style={{ backgroundColor: accent }} />
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
        {label}
      </Text>
      <Title order={3} mt={8}>
        {title}
      </Title>
      <Text size="sm" c="dimmed" mt={6}>
        {detail}
      </Text>
    </Paper>
  );
}

/**
 * Renders either branded platform artwork or a platform icon fallback when no image is available.
 */
function ChannelArtwork({
  platform,
  size = 120,
}: {
  platform: Platform;
  size?: number;
}) {
  const src = getIntegrationPlatformImage(platform.platformKey, platform.imageUrl);

  if (!src) {
    return (
      <ThemeIcon
        size={size}
        radius="xl"
        variant="light"
        color={getIntegrationStatusColor(platform.status)}
      >
        {getPlatformIcon(platform.platformKey, Math.round(size * 0.48), 1.5)}
      </ThemeIcon>
    );
  }

  return (
    <MantineImage
      src={src}
      alt={platform.platformName}
      w={size}
      h={size}
      fit="contain"
      className={styles.platformArtwork}
    />
  );
}

export default function IntegrationClient({ platforms }: PlatformListProps) {
  const [disconnectingPlatformId, setDisconnectingPlatformId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<DisplayPlatform | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [focusedPlatformId, setFocusedPlatformId] = useState<string | null>(null);
  const [accountSelectionPlatform, setAccountSelectionPlatform] = useState<Platform | null>(null);
  const [accountOptions, setAccountOptions] = useState<MetaAccountOption[]>([]);
  const [selectedAccountExternalId, setSelectedAccountExternalId] = useState<string | null>(null);
  const [loadingAccountOptions, setLoadingAccountOptions] = useState(false);
  const [submittingAccountSelection, setSubmittingAccountSelection] = useState(false);
  const [pitchDetachedPlatforms, setPitchDetachedPlatforms] = useState<PitchDetachedPlatform[]>([]);
  const [googleCredentialModalOpened, setGoogleCredentialModalOpened] = useState(false);
  const [googleCredentialSaving, setGoogleCredentialSaving] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [googleDeveloperToken, setGoogleDeveloperToken] = useState('');
  const [googleLoginCustomerId, setGoogleLoginCustomerId] = useState('');
  const [googleScopes, setGoogleScopes] = useState('https://www.googleapis.com/auth/adwords');
  const [googleDiagnosticsOpened, setGoogleDiagnosticsOpened] = useState(false);
  const [googleDiagnosticsLoading, setGoogleDiagnosticsLoading] = useState(false);
  const [googleDiagnostics, setGoogleDiagnostics] = useState<GoogleDiagnosticsResponse['data'] | null>(null);
  const handledGoogleSearchKey = useRef<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const syncPitchDetachedPlatforms = () => {
      setPitchDetachedPlatforms(readPitchDetachedPlatforms());
    };

    syncPitchDetachedPlatforms();
    window.addEventListener('storage', syncPitchDetachedPlatforms);

    return () => {
      window.removeEventListener('storage', syncPitchDetachedPlatforms);
    };
  }, []);

  const pitchDetachedByPlatformId = useMemo(
    () => new Map(pitchDetachedPlatforms.map((platform) => [platform.platformId, platform])),
    [pitchDetachedPlatforms]
  );

  const sortedPlatforms = useMemo(
    () => sortIntegrationPlatforms(
      platforms.map((platform) => {
        const detached = !platform.integrationId && pitchDetachedByPlatformId.has(platform.id);

        return {
          ...platform,
          status: detached ? 'disconnected' : platform.status,
          lastError: detached ? null : platform.lastError,
          pitchDetached: detached,
        } satisfies DisplayPlatform;
      })
    ),
    [pitchDetachedByPlatformId, platforms]
  );
  const connectedPlatforms = sortedPlatforms.filter((platform) => isIntegrationConnected(platform.status));
  const attentionPlatforms = sortedPlatforms.filter((platform) => integrationNeedsAttention(platform.status));
  const latestSyncedPlatform = [...connectedPlatforms]
    .filter((platform) => platform.lastSyncedAt)
    .sort((left, right) => {
      const leftValue = new Date(left.lastSyncedAt ?? '').getTime();
      const rightValue = new Date(right.lastSyncedAt ?? '').getTime();
      return rightValue - leftValue;
    })[0] ?? null;

  const syncCoverage = sortedPlatforms.length > 0
    ? Math.round((connectedPlatforms.length / sortedPlatforms.length) * 100)
    : 0;
  const focusedPlatform =
    sortedPlatforms.find((platform) => platform.id === focusedPlatformId) ??
    connectedPlatforms[0] ??
    sortedPlatforms[0] ??
    null;
  const focusedPalette = {
    ...getIntegrationPlatformPalette(focusedPlatform?.platformKey ?? 'default'),
    accent: '#fd4b23',
    accentSoft: 'rgba(253, 75, 35, 0.14)',
    accentSurface: 'rgba(253, 75, 35, 0.08)',
    border: 'rgba(253, 75, 35, 0.24)',
    text: '#111111',
  };
  const focusedPlatformConnected = focusedPlatform
    ? isIntegrationConnected(focusedPlatform.status)
    : false;
  const focusedPlatformPitchDetached = Boolean(focusedPlatform?.pitchDetached);
  const focusedPlatformNeedsAttention = focusedPlatform
    ? integrationNeedsAttention(focusedPlatform.status)
    : false;
  const focusedPlatformPreviewOnly = Boolean(focusedPlatform) &&
    !focusedPlatformConnected &&
    focusedPlatform?.platformKey !== 'meta' &&
    focusedPlatform?.platformKey !== 'google';
  const focusedHeroTitle = !focusedPlatform
    ? 'Connect each ad channel once, then let DeepVisor run from it.'
    : focusedPlatformPitchDetached
      ? `Reconnect ${focusedPlatform.platformName} and reattach saved workspace data.`
    : focusedPlatformConnected
      ? `${focusedPlatform.platformName} is connected and driving this workspace.`
      : `Connect ${focusedPlatform.platformName}`;
  const focusedHeroDescription = !focusedPlatform
    ? 'Pick the platform, choose the one ad account DeepVisor should watch, and see which channels are live, preview-only, or need attention before reports, dashboard, and calendar work depend on them.'
    : focusedPlatformPitchDetached
      ? `This pitch-safe detach keeps the synced workspace data intact while making ${focusedPlatform.platformName} look disconnected here. Reconnect to replay the Meta connection story without rebuilding the workspace.`
    : focusedPlatformConnected
      ? `${focusedPlatform.platformName} is already live in DeepVisor. Keep its sync current, manage its primary ad account, and use this as the clean channel source for dashboard, reports, and calendar work.`
      : focusedPlatform.platformKey === 'meta'
        ? 'Authorize Meta, choose the one ad account DeepVisor should watch, and start feeding reporting, calendar, and recommendations from a single clean source.'
        : focusedPlatform.platformKey === 'google'
          ? 'Authorize Google Ads, choose one customer account, and sync campaigns, ad groups, ads, and recent performance into reports.'
        : `${focusedPlatform.platformName} is still a preview channel. Its connection pattern is visible here so you can plan how it will slot into the workspace once support is enabled.`;
  const focusedPrimaryLabel = !focusedPlatform
    ? 'Sync connected channels'
    : focusedPlatformPitchDetached
      ? `Reconnect ${focusedPlatform.platformName}`
    : focusedPlatformConnected
      ? `Sync ${focusedPlatform.platformName}`
      : focusedPlatformNeedsAttention
        ? `Reconnect ${focusedPlatform.platformName}`
        : `Connect ${focusedPlatform.platformName}`;
  const focusedPrimaryDisabled = !focusedPlatform || focusedPlatformPreviewOnly;
  const heroCardStyle = {
    borderColor: focusedPalette.border,
  } satisfies CSSProperties;

  const syncPitchDetachedState = () => {
    setPitchDetachedPlatforms(readPitchDetachedPlatforms());
  };

  useEffect(() => {
    if (!selectedPlatform) {
      return;
    }

    const nextSelectedPlatform = sortedPlatforms.find((platform) => platform.id === selectedPlatform.id) ?? null;

    if (
      nextSelectedPlatform &&
      (
        nextSelectedPlatform.status !== selectedPlatform.status ||
        nextSelectedPlatform.pitchDetached !== selectedPlatform.pitchDetached ||
        nextSelectedPlatform.primaryAdAccountExternalId !== selectedPlatform.primaryAdAccountExternalId ||
        nextSelectedPlatform.primaryAdAccountName !== selectedPlatform.primaryAdAccountName
      )
    ) {
      setSelectedPlatform(nextSelectedPlatform);
    }
  }, [selectedPlatform, sortedPlatforms]);

  const handleDisconnect = async (platform: Platform) => {
    if (!confirm(`Disconnect ${platform.platformName}?`)) {
      return;
    }

    if (!platform.integrationId) {
      toast.error('No integration found for this platform.');
      return;
    }

    setDisconnectingPlatformId(platform.id);
    try {
      const response = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ integrationId: platform.integrationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect integration');
      }

      toast.success(`${platform.platformName} disconnected successfully.`);
      router.refresh();
      setSelectedPlatform((current) => (current?.id === platform.id ? null : current));
    } catch (error) {
      console.error(`Error disconnecting ${platform.platformName}:`, error);
      toast.error(`Failed to disconnect ${platform.platformName}. Please try again.`);
    } finally {
      setDisconnectingPlatformId(null);
    }
  };

  const handleRefreshConnections = async (platformKey?: string) => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/sync/refresh', {
        method: 'POST',
        headers: platformKey
          ? {
              'Content-Type': 'application/json',
            }
          : undefined,
        body: platformKey ? JSON.stringify({ platformKey }) : undefined,
      });
      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        retryAfterMs?: number;
      };

      if (!response.ok || !result.success) {
        if (response.status === 429) {
          throw new Error(result.message || formatRetryDelay(result.retryAfterMs));
        }

        throw new Error(result.message || 'Failed to refresh sync');
      }

      toast.success(result.message || 'Sync completed successfully.');
      router.refresh();
    } catch (error) {
      console.error('Error refreshing connections:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to refresh sync.');
    } finally {
      setRefreshing(false);
    }
  };

  const startGoogleOAuth = () => {
    const encodedReturnTo = encodeURIComponent('/integration');
    window.location.href = `/api/integrations/connect/google?returnTo=${encodedReturnTo}`;
  };

  const connectGoogle = async () => {
    setConnectingGoogle(true);

    try {
      const response = await fetch('/api/integrations/google/credentials');
      const body = (await response.json().catch(() => ({}))) as GoogleCredentialResponse;

      if (!response.ok || !body.success) {
        throw new Error(body.error?.userMessage || 'Failed to check Google Ads credentials.');
      }

      if (body.data?.mode === 'app' && body.data.configured) {
        startGoogleOAuth();
        return;
      }

      if (body.data?.mode === 'workspace' && body.data.source === 'workspace') {
        startGoogleOAuth();
        return;
      }

      if (body.data?.mode === 'app') {
        throw new Error('Google Ads app credentials are not configured on this deployment.');
      }

      setGoogleScopes(body.data?.scopes || 'https://www.googleapis.com/auth/adwords');
      setGoogleLoginCustomerId(body.data?.loginCustomerId || '');
      setGoogleCredentialModalOpened(true);
      setConnectingGoogle(false);
    } catch (error) {
      setConnectingGoogle(false);
      toast.error(error instanceof Error ? error.message : 'Failed to start Google Ads connection.');
    }
  };

  const canPlatformConnectNow = (platform: Platform | DisplayPlatform | null): boolean => {
    return Boolean(
      platform &&
        !isIntegrationConnected(platform.status) &&
        (platform.platformKey === 'meta' || platform.platformKey === 'google')
    );
  };

  const connectPlatform = (platform: Platform | DisplayPlatform | null, connectMeta: () => void) => {
    if (!platform) return;
    if (platform.platformKey === 'meta') {
      connectMeta();
      return;
    }
    if (platform.platformKey === 'google') {
      void connectGoogle();
    }
  };

  const saveGoogleCredentialsAndConnect = async () => {
    setGoogleCredentialSaving(true);

    try {
      const response = await fetch('/api/integrations/google/credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          developerToken: googleDeveloperToken,
          loginCustomerId: googleLoginCustomerId,
          scopes: googleScopes,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as GoogleCredentialResponse;

      if (!response.ok || !body.success) {
        throw new Error(body.error?.userMessage || 'Failed to save Google Ads credentials.');
      }

      toast.success('Google Ads credentials saved.');
      setGoogleCredentialModalOpened(false);
      setConnectingGoogle(true);
      startGoogleOAuth();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save Google Ads credentials.');
    } finally {
      setGoogleCredentialSaving(false);
    }
  };

  const openGoogleDiagnostics = async (integrationId?: string | null) => {
    setGoogleDiagnosticsOpened(true);
    setGoogleDiagnosticsLoading(true);
    setGoogleDiagnostics(null);

    try {
      const query = integrationId ? `?integrationId=${encodeURIComponent(integrationId)}` : '';
      const response = await fetch(`/api/integrations/google/diagnostics${query}`);
      const body = (await response.json().catch(() => ({}))) as GoogleDiagnosticsResponse;

      if (!response.ok || !body.success) {
        throw new Error(body.error?.userMessage || 'Failed to run Google Ads diagnostics.');
      }

      setGoogleDiagnostics(body.data ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to run Google Ads diagnostics.');
    } finally {
      setGoogleDiagnosticsLoading(false);
    }
  };

  useEffect(() => {
    const flow = readFlowState(searchParams);
    const searchKey = searchParams.toString();

    if (handledGoogleSearchKey.current === searchKey) {
      return;
    }

    if (flow.integration !== 'google' || !flow.status) {
      return;
    }

    handledGoogleSearchKey.current = searchKey;

    if (flow.status === 'error') {
      setConnectingGoogle(false);
      toast.error('Failed to connect Google Ads. Please try again.');
      router.replace('/integration');
      router.refresh();
      return;
    }

    const platform = sortedPlatforms.find(
      (candidate) => candidate.platformKey === 'google' && candidate.integrationId === flow.integrationId
    );

    if (flow.requiresAccountSelection && flow.integrationId && platform) {
      void handleOpenAccountSelection(platform, {
        preferredExternalAccountId: flow.externalAccountId,
        autoSync: flow.autoSync,
      });
      router.replace('/integration');
      return;
    }

    if (flow.status === 'connected') {
      setConnectingGoogle(false);
      toast.success('Google Ads connected successfully.');
      router.replace('/integration');
      router.refresh();
    }
  }, [router, searchParams, sortedPlatforms]);

  const handleOpenAccountSelection = async (
    platform: Platform,
    options?: { preferredExternalAccountId?: string | null; autoSync?: boolean }
  ) => {
    if ((platform.platformKey !== 'meta' && platform.platformKey !== 'google') || !platform.integrationId) {
      return;
    }

    setSelectedPlatform(null);
    setAccountSelectionPlatform(platform);
    setAccountOptions([]);
    setSelectedAccountExternalId(options?.preferredExternalAccountId ?? platform.primaryAdAccountExternalId);
    setLoadingAccountOptions(true);

    try {
      const response = await fetch(
        `/api/integrations/${platform.platformKey}/ad-accounts?integrationId=${platform.integrationId}`
      );
      const body = (await response.json().catch(() => ({}))) as MetaAccountListResponse;

      if (!response.ok || !body?.success) {
        throw new Error(body?.error?.userMessage || `Failed to load ${platform.platformName} accounts`);
      }

      const accountOptionsResult = Array.isArray(body.data?.accounts)
        ? body.data.accounts.map((account) => ({
            value: account.externalAccountId,
            label: account.name || account.externalAccountId,
          }))
        : [];

      setAccountOptions(accountOptionsResult);
      setSelectedAccountExternalId(
        options?.preferredExternalAccountId ??
          body.data?.primaryAdAccountExternalId ??
          platform.primaryAdAccountExternalId ??
          accountOptionsResult[0]?.value ??
          null
      );
    } catch (error) {
      console.error(`Error loading ${platform.platformName} accounts:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to load ${platform.platformName} accounts.`);
      setAccountSelectionPlatform(null);
    } finally {
      setLoadingAccountOptions(false);
    }
  };

  const handleSelectAdAccount = async () => {
    if (
      !accountSelectionPlatform?.integrationId ||
      !selectedAccountExternalId ||
      submittingAccountSelection
    ) {
      return;
    }

    setSubmittingAccountSelection(true);

    try {
      const response = await fetch(`/api/integrations/${accountSelectionPlatform.platformKey}/select-ad-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integrationId: accountSelectionPlatform.integrationId,
          externalAccountId: selectedAccountExternalId,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as MetaSelectResponse;

      if (!response.ok || !body?.success) {
        throw new Error(body?.error?.userMessage || `Failed to change ${accountSelectionPlatform.platformName} account`);
      }

      toast.success(
        body.data?.firstSyncJob
          ? `Primary ${accountSelectionPlatform.platformName} account changed. Full history sync started.`
          : `Primary ${accountSelectionPlatform.platformName} account changed and sync started.`
      );
      setAccountSelectionPlatform(null);
      router.refresh();
    } catch (error) {
      console.error(`Error selecting ${accountSelectionPlatform.platformName} account:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to change ${accountSelectionPlatform.platformName} account.`);
    } finally {
      setSubmittingAccountSelection(false);
    }
  };

  return (
    <MetaIntegrationFlow returnTo="/integration">
      {({ connectMeta, connecting }) => (
        <Container fluid pos="relative" className={styles.integrationPage}>
          <LoadingOverlay
            visible={refreshing}
            zIndex={1000}
            overlayProps={{ radius: 'sm', blur: 2 }}
          />

          <Stack gap="xl">
            <Card
              withBorder
              radius="xl"
              p="xl"
              className={`${styles.heroCard} app-platform-page-hero`}
              style={heroCardStyle}
            >
              <div
                className={styles.heroGlowLeft}
                style={{ background: focusedPalette.accentSurface } as CSSProperties}
              />
              <div
                className={styles.heroGlowRight}
                style={{ background: focusedPalette.accentSoft } as CSSProperties}
              />
              <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
                <Stack gap="md" className={styles.heroContent}>
                  <Group gap="xs" wrap="wrap">
                    <Badge variant="light" className="app-platform-page-badge">
                      Integrations
                    </Badge>
                    {focusedPlatform ? (
                      <Badge
                        variant="light"
                        style={{
                          backgroundColor: focusedPalette.accentSoft,
                        }}
                        >
                          {focusedPlatform.platformName}
                        </Badge>
                    ) : null}
                  </Group>

                  <div>
                    <Title order={2}>
                      {focusedHeroTitle}
                    </Title>
                    <Text size="md" c="dimmed" mt="sm" maw={680}>
                      {focusedHeroDescription}
                    </Text>
                  </div>

                  <Group gap="sm" wrap="wrap">
                    <Button
                      leftSection={
                        focusedPlatformConnected ? <IconRefresh size={16} /> : <IconLink size={16} />
                      }
                      onClick={() => {
                        if (!focusedPlatform) {
                          void handleRefreshConnections();
                          return;
                        }

                        if (focusedPlatformConnected) {
                          void handleRefreshConnections(focusedPlatform.platformKey);
                          return;
                        }

                        connectPlatform(focusedPlatform, connectMeta);
                      }}
                      loading={
                        focusedPlatformConnected
                          ? refreshing
                          : focusedPlatform?.platformKey === 'meta'
                            ? connecting
                            : focusedPlatform?.platformKey === 'google'
                              ? connectingGoogle
                            : false
                      }
                      disabled={focusedPrimaryDisabled}
                      radius="xl"
                      style={
                        focusedPrimaryDisabled
                          ? undefined
                          : ({
                              backgroundColor: focusedPalette.accent,
                              color: '#ffffff',
                            } as CSSProperties)
                      }
                    >
                      {focusedPrimaryLabel}
                    </Button>
                    {focusedPlatform ? (
                      <Button
                        leftSection={
                          focusedPlatformConnected &&
                          (focusedPlatform.platformKey === 'meta' || focusedPlatform.platformKey === 'google') &&
                          focusedPlatform.discoveredAdAccountCount > 1
                            ? <IconSettings size={16} />
                            : <IconArrowUpRight size={16} />
                        }
                        variant="light"
                        radius="xl"
                        onClick={() => {
                          if (
                            (focusedPlatform.platformKey === 'meta' || focusedPlatform.platformKey === 'google') &&
                            focusedPlatformConnected &&
                            focusedPlatform.discoveredAdAccountCount > 1
                          ) {
                            void handleOpenAccountSelection(focusedPlatform);
                            return;
                          }

                          setSelectedPlatform(focusedPlatform);
                        }}
                        style={{
                          backgroundColor: focusedPalette.accentSoft,
                        }}
                      >
                        {focusedPlatformConnected &&
                        (focusedPlatform.platformKey === 'meta' || focusedPlatform.platformKey === 'google') &&
                        focusedPlatform.discoveredAdAccountCount > 1
                          ? 'Change ad account'
                          : `View ${focusedPlatform.platformName}`}
                      </Button>
                    ) : null}
                    {focusedPlatform?.platformKey === 'google' ? (
                      <Button
                        leftSection={<IconSettings size={16} />}
                        variant="default"
                        radius="xl"
                        onClick={() => void openGoogleDiagnostics(focusedPlatform.integrationId)}
                      >
                        Diagnostics
                      </Button>
                    ) : null}
                  </Group>

                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <SummaryCard
                      label="Connected"
                      title={String(connectedPlatforms.length)}
                      detail={`${sortedPlatforms.length} total channels in your workspace`}
                      accent="#fd4b23"
                    />
                    <SummaryCard
                      label="Needs Attention"
                      title={String(attentionPlatforms.length)}
                      detail={
                        attentionPlatforms.length > 0
                          ? 'At least one channel needs review or reconnect.'
                          : 'No reconnect or error states right now.'
                      }
                      accent="#111111"
                    />
                    <SummaryCard
                      label="Latest Sync"
                      title={
                        latestSyncedPlatform
                          ? latestSyncedPlatform.platformName
                          : 'No completed sync'
                      }
                      detail={
                        latestSyncedPlatform
                          ? formatRelativeTime(latestSyncedPlatform.lastSyncedAt, { emptyLabel: 'Not synced yet' })
                          : 'Connect a platform to start pulling data.'
                      }
                      accent="#fd4b23"
                    />
                    <SummaryCard
                      label="Primary Scope"
                      title="1 account / platform"
                      detail="Keeps reporting, recommendations, and queueing focused on one clean dataset."
                      accent="#111111"
                    />
                  </SimpleGrid>
                </Stack>

                <Paper withBorder radius="xl" p="lg" className={`${styles.heroSidebar} app-platform-page-hero-panel`}>
                  <Group justify="space-between" align="flex-start" mb="md">
                    <div>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                        Channel status
                      </Text>
                      <Title order={4} mt={4}>
                        Current connection map
                      </Title>
                    </div>
                    <Badge color={syncCoverage > 0 ? 'orange' : 'gray'} variant="light">
                      {syncCoverage}%
                    </Badge>
                  </Group>

                  <Progress
                    value={syncCoverage}
                    size="lg"
                    radius="xl"
                    color={focusedPalette.accent}
                  />
                  <Text size="xs" c="dimmed" mt="sm">
                    Select a channel to update the hero card and action state.
                  </Text>

                  <Stack gap="sm" mt="lg">
                    {sortedPlatforms.map((platform) => {
                      const palette = getIntegrationPlatformPalette(platform.platformKey);
                      const isFocused = focusedPlatform?.id === platform.id;

                      return (
                        <Paper
                          key={platform.id}
                          withBorder
                          radius="lg"
                          p="sm"
                          className={`${styles.statusRow} ${isFocused ? styles.statusRowActive : ''}`}
                          style={{
                            borderColor: isFocused ? 'rgba(253, 75, 35, 0.88)' : undefined,
                            background: isFocused ? 'rgba(253, 75, 35, 0.08)' : undefined,
                            boxShadow: isFocused
                              ? '0 18px 36px rgba(253, 75, 35, 0.18)'
                              : undefined,
                          } as CSSProperties}
                          role="button"
                          tabIndex={0}
                          onClick={() => setFocusedPlatformId(platform.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setFocusedPlatformId(platform.id);
                            }
                          }}
                        >
                          <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                            <Group gap="sm" wrap="nowrap">
                              <ThemeIcon
                                size="lg"
                                radius="xl"
                                variant="light"
                                style={{
                                  backgroundColor: palette.accentSoft,
                                  color: palette.accent,
                                }}
                              >
                                {getPlatformIcon(platform.platformKey, 18, 1.5)}
                              </ThemeIcon>
                              <div style={{ minWidth: 0 }}>
                                <Text fw={700} size="sm" lineClamp={1}>
                                  {platform.platformName}
                                </Text>
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {getIntegrationAvailabilityCopy(platform)}
                                </Text>
                              </div>
                            </Group>

                            <Badge
                              size="sm"
                              color={getIntegrationStatusColor(platform.status)}
                              variant={isIntegrationConnected(platform.status) ? 'light' : 'outline'}
                            >
                              {getIntegrationStatusLabel(platform.status)}
                            </Badge>
                          </Group>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Paper>
              </SimpleGrid>
            </Card>

            <Paper withBorder radius="xl" p="xl" className={styles.guideCard}>
              <Group justify="space-between" align="flex-start" mb="lg" wrap="wrap">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Setup Flow
                  </Text>
                  <Title order={3} mt={4}>
                    How channel setup works in DeepVisor
                  </Title>
                </div>
                <Badge color="gray" variant="light">
                  Built for simple account scope
                </Badge>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                <Paper withBorder radius="lg" p="md" className={styles.stepCard}>
                  <ThemeIcon size="xl" radius="xl" variant="light" color="orange">
                    <IconLink size={20} />
                  </ThemeIcon>
                  <Text fw={700} mt="md">
                    1. Connect a platform
                  </Text>
                  <Text size="sm" c="dimmed" mt={6}>
                    Start with Meta today. Other channels stay visible as preview cards so the
                    product direction remains clear.
                  </Text>
                </Paper>

                <Paper withBorder radius="lg" p="md" className={styles.stepCard}>
                  <ThemeIcon size="xl" radius="xl" variant="light" color="orange">
                    <IconLock size={20} />
                  </ThemeIcon>
                  <Text fw={700} mt="md">
                    2. Choose one primary ad account
                  </Text>
                  <Text size="sm" c="dimmed" mt={6}>
                    Each platform syncs one clean account into Dashboard, Reports, Calendar, and the
                    assistant so the workspace stays focused.
                  </Text>
                </Paper>

                <Paper withBorder radius="lg" p="md" className={styles.stepCard}>
                  <ThemeIcon size="xl" radius="xl" variant="light" color="teal">
                    <IconArrowUpRight size={20} />
                  </ThemeIcon>
                  <Text fw={700} mt="md">
                    3. DeepVisor keeps data flowing
                  </Text>
                  <Text size="sm" c="dimmed" mt={6}>
                    Once connected, sync keeps performance data, recommendations, and queued work
                    aligned across the rest of the app.
                  </Text>
                </Paper>
              </SimpleGrid>
            </Paper>

            <div>
              <Group justify="space-between" align="flex-end" mb="md" wrap="wrap">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    Channel Directory
                  </Text>
                  <Title order={3} mt={4}>
                    Connect, inspect, and manage each advertising platform
                  </Title>
                  <Text size="sm" c="dimmed" mt={4}>
                    Connected channels surface health and sync timing. Preview channels show how the
                    workspace can expand next.
                  </Text>
                </div>
                <Badge color="gray" variant="light">
                  {sortedPlatforms.length} platforms
                </Badge>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="lg">
                {sortedPlatforms.map((platform) => {
                  const palette = getIntegrationPlatformPalette(platform.platformKey);
                  const artwork = getIntegrationPlatformImage(platform.platformKey, platform.imageUrl);
                  const disconnected = !isIntegrationConnected(platform.status);
                  const canConnectNow = canPlatformConnectNow(platform);
                  const canManageLive = Boolean(platform.integrationId) && isIntegrationConnected(platform.status);
                  const platformError = platform.lastError;
                  const disconnecting = disconnectingPlatformId === platform.id;

                  return (
                    <Card
                      key={platform.id}
                      withBorder
                      radius="xl"
                      p={0}
                      className={styles.channelCard}
                    >
                      <Card.Section
                        className={styles.channelVisual}
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(17, 17, 17, 0.985), rgba(17, 17, 17, 0.92))',
                          borderBottom: '1px solid rgba(17, 17, 17, 0.9)',
                        }}
                      >
                        <Group justify="space-between" align="center" w="100%">
                          <Badge
                            className={styles.channelStatusBadge}
                            color={getIntegrationStatusColor(platform.status)}
                            variant={isIntegrationConnected(platform.status) ? 'light' : 'outline'}
                            leftSection={
                              isIntegrationConnected(platform.status) ? (
                                <IconCheck size={12} />
                              ) : integrationNeedsAttention(platform.status) ? (
                                <IconAlertTriangle size={12} />
                              ) : undefined
                            }
                          >
                            {getIntegrationStatusLabel(platform.status)}
                          </Badge>

                          <ThemeIcon
                            size="xl"
                            radius="xl"
                            variant="white"
                            style={{ color: palette.accent }}
                          >
                            {getPlatformIcon(platform.platformKey, 22, 1.6)}
                          </ThemeIcon>
                        </Group>

                        <div className={styles.channelArtworkStage}>
                          <div
                            className={styles.channelGlowPrimary}
                            style={{ backgroundColor: palette.accentSoft }}
                          />
                          <div
                            className={styles.channelGlowSecondary}
                            style={{ backgroundColor: palette.accentSoft }}
                          />
                          <div className={styles.channelArtworkShadow} />
                          <div className={styles.channelArtworkWrap}>
                            {artwork ? (
                              <ChannelArtwork platform={platform} size={112} />
                            ) : null}
                          </div>
                        </div>
                      </Card.Section>

                      <Stack gap="md" p="lg" style={{ flex: 1 }}>
                        <div>
                          <Group gap="xs" wrap="wrap" mb={6}>
                            <Text fw={700} size="lg">
                              {platform.platformName}
                            </Text>
                            {!platform.integrationId && platform.platformKey !== 'meta' && platform.platformKey !== 'google' ? (
                              <Badge color="gray" variant="light">
                                Preview
                              </Badge>
                            ) : null}
                          </Group>
                          <Text size="sm" c="dimmed">
                            {platform.description || platform.fullDescription || 'No description available yet.'}
                          </Text>
                        </div>

                        <SimpleGrid cols={2} spacing="sm">
                          <Paper withBorder radius="lg" p="sm" className={styles.metricCard}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                              Sync state
                            </Text>
                            <Text fw={700} mt={4}>
                              {formatRelativeTime(platform.lastSyncedAt, { emptyLabel: 'Not synced yet' })}
                            </Text>
                          </Paper>
                          <Paper withBorder radius="lg" p="sm" className={styles.metricCard}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                              Account rule
                            </Text>
                            <Text fw={700} mt={4}>
                              1 primary account
                            </Text>
                          </Paper>
                        </SimpleGrid>

                        {platformError ? (
                          <Alert
                            color="red"
                            radius="lg"
                            variant="light"
                            icon={<IconAlertTriangle size={16} />}
                          >
                            {platformError}
                          </Alert>
                        ) : null}

                        <Paper
                          withBorder
                          radius="lg"
                          p="sm"
                          className={styles.copyPanel}
                          style={{
                            borderColor: 'rgba(253, 75, 35, 0.18)',
                            backgroundColor: 'rgba(253, 75, 35, 0.07)',
                          }}
                        >
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            What this channel is good at
                          </Text>
                          <Text size="sm" mt={6}>
                            {platform.strengths || platform.description || 'No strengths summary yet.'}
                          </Text>
                        </Paper>

                        <Group justify="space-between" align="center" mt="auto" wrap="wrap">
                          <Group gap="xs" wrap="wrap">
                            {canManageLive ? (
                              <>
                                <Button
                                  leftSection={<IconRefresh size={16} />}
                                  variant="light"
                                  onClick={() => void handleRefreshConnections(platform.platformKey)}
                                  loading={refreshing}
                                >
                                  Refresh data
                                </Button>
                                {(platform.platformKey === 'meta' || platform.platformKey === 'google') &&
                                platform.discoveredAdAccountCount > 1 ? (
                                  <Button
                                    variant="default"
                                    onClick={() => void handleOpenAccountSelection(platform)}
                                  >
                                    Change ad account
                                  </Button>
                                ) : null}
  
                              </>
                            ) : canConnectNow ? (
                              <Button
                                leftSection={<IconLink size={16} />}
                                onClick={() => {
                                  connectPlatform(platform, connectMeta);
                                }}
                                loading={platform.platformKey === 'meta' ? connecting : connectingGoogle}
                              >
                                {integrationNeedsAttention(platform.status)
                                  ? `Reconnect ${platform.platformName}`
                                  : `Connect ${platform.platformName}`}
                              </Button>
                            ) : (
                              <Button
                                leftSection={<IconLock size={16} />}
                                variant="light"
                                color="gray"
                                disabled
                              >
                                Preview only
                              </Button>
                            )}

                            <Button
                              variant="default"
                              onClick={() => setSelectedPlatform(platform)}
                            >
                              Details
                            </Button>
                          </Group>

                          {platform.integrationId ? (
                            <Menu shadow="md" position="bottom-end">
                              <Menu.Target>
                                <ActionIcon variant="default" radius="xl" size="lg">
                                  <IconSettings size={16} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Label>{platform.platformName}</Menu.Label>
                                <Menu.Item onClick={() => setSelectedPlatform(platform)}>
                                  View details
                                </Menu.Item>

                                <Menu.Divider />
                                <Menu.Item
                                  color="red"
                                  leftSection={<IconTrash size={14} />}
                                  onClick={() => handleDisconnect(platform)}
                                  disabled={disconnecting}
                                >
                                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          ) : null}
                        </Group>
                      </Stack>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </div>

            <Modal
              opened={googleDiagnosticsOpened}
              onClose={() => setGoogleDiagnosticsOpened(false)}
              title="Google Ads diagnostics"
              centered
              size="xl"
            >
              <Stack gap="md">
                {googleDiagnosticsLoading ? (
                  <Progress value={65} animated striped radius="xl" />
                ) : (
                  <>
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                      <Paper withBorder radius="lg" p="md">
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Credential mode</Text>
                        <Title order={4} mt={4}>{googleDiagnostics?.credentials?.mode ?? 'unknown'}</Title>
                        <Text size="sm" c="dimmed">
                          Source: {googleDiagnostics?.credentials?.source ?? 'missing'} | Developer token:{' '}
                          {googleDiagnostics?.credentials?.developerTokenConfigured ? 'configured' : 'missing'}
                        </Text>
                      </Paper>
                      <Paper withBorder radius="lg" p="md">
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>OAuth status</Text>
                        <Title order={4} mt={4}>
                          {googleDiagnostics?.refreshToken?.valid ? 'Valid' : 'Needs review'}
                        </Title>
                        <Text size="sm" c="dimmed">
                          Refresh token: {googleDiagnostics?.refreshToken?.present ? 'present' : 'missing'}
                        </Text>
                      </Paper>
                      <Paper withBorder radius="lg" p="md">
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Accessible customers</Text>
                        <Title order={4} mt={4}>{googleDiagnostics?.accessibleAccounts?.count ?? 0}</Title>
                        <Text size="sm" c="dimmed">
                          {googleDiagnostics?.accessibleAccounts?.message ?? 'Customer list loaded.'}
                        </Text>
                      </Paper>
                      <Paper withBorder radius="lg" p="md">
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Database readiness</Text>
                        <Title order={4} mt={4}>{googleDiagnostics?.dbHealth?.ok ? 'Ready' : 'Needs review'}</Title>
                        <Text size="sm" c="dimmed">Google reporting tables and seed rows.</Text>
                      </Paper>
                    </SimpleGrid>

                    <div className="dv-table">
                      {(googleDiagnostics?.accessibleAccounts?.accounts ?? []).map((account) => (
                        <div className="dv-table-row" key={account.externalAccountId}>
                          <div>
                            <strong>{account.name ?? account.externalAccountId}</strong>
                            <span>{account.externalAccountId}</span>
                          </div>
                          <span>{account.status ?? 'available'}</span>
                        </div>
                      ))}
                      {(googleDiagnostics?.dbHealth?.checks ?? []).map((check) => (
                        <div className="dv-table-row" key={check.object}>
                          <div>
                            <strong>{check.object}</strong>
                            <span>{check.message ?? 'OK'}</span>
                          </div>
                          <Badge color={check.ok ? 'green' : 'red'} variant="light">
                            {check.ok ? 'OK' : 'Error'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Stack>
            </Modal>

            <Modal
              opened={googleCredentialModalOpened}
              onClose={() => {
                if (!googleCredentialSaving) {
                  setGoogleCredentialModalOpened(false);
                }
              }}
              title="Google Ads credentials"
              centered
              size="lg"
            >
              <Stack gap="md">
                <Alert color="orange" radius="lg" variant="light" icon={<IconLock size={16} />}>
                  These credentials are saved for this workspace only. The client secret and developer token are stored in Vault and are not shown again.
                </Alert>

                <TextInput
                  label="OAuth client ID"
                  placeholder="1234567890-abc.apps.googleusercontent.com"
                  value={googleClientId}
                  onChange={(event) => setGoogleClientId(event.currentTarget.value)}
                  disabled={googleCredentialSaving}
                />

                <PasswordInput
                  label="OAuth client secret"
                  placeholder="GOCSPX-..."
                  value={googleClientSecret}
                  onChange={(event) => setGoogleClientSecret(event.currentTarget.value)}
                  disabled={googleCredentialSaving}
                />

                <PasswordInput
                  label="Google Ads developer token"
                  placeholder="Developer token from Google Ads API Center"
                  value={googleDeveloperToken}
                  onChange={(event) => setGoogleDeveloperToken(event.currentTarget.value)}
                  disabled={googleCredentialSaving}
                />

                <TextInput
                  label="Login customer ID"
                  description="Optional manager/MCC customer ID. Use digits only or paste with dashes."
                  placeholder="4556089496"
                  value={googleLoginCustomerId}
                  onChange={(event) => setGoogleLoginCustomerId(event.currentTarget.value)}
                  disabled={googleCredentialSaving}
                />

                <TextInput
                  label="OAuth scopes"
                  value={googleScopes}
                  onChange={(event) => setGoogleScopes(event.currentTarget.value)}
                  disabled={googleCredentialSaving}
                />

                <Alert color="yellow" radius="lg" variant="light" icon={<IconAlertTriangle size={16} />}>
                  Add this app callback URL to that Google Cloud OAuth client: {typeof window !== 'undefined' ? `${window.location.origin}/api/integrations/callback/google` : '/api/integrations/callback/google'}
                </Alert>

                <Group justify="flex-end" gap="sm">
                  <Button
                    variant="default"
                    onClick={() => setGoogleCredentialModalOpened(false)}
                    disabled={googleCredentialSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveGoogleCredentialsAndConnect}
                    loading={googleCredentialSaving}
                    disabled={!googleClientId.trim() || !googleClientSecret.trim() || !googleDeveloperToken.trim()}
                  >
                    Save and connect
                  </Button>
                </Group>
              </Stack>
            </Modal>

            <Modal
              opened={Boolean(accountSelectionPlatform)}
              onClose={() => {
                if (!submittingAccountSelection) {
                  setAccountSelectionPlatform(null);
                }
              }}
              title={`Change ${accountSelectionPlatform?.platformName ?? 'ad'} account`}
              centered
            >
              <Stack gap="md">
                {submittingAccountSelection ? (
                  <>
                    <Text size="sm" c="dimmed">
                      DeepVisor is saving the selected {accountSelectionPlatform?.platformName ?? 'platform'} account and syncing recent campaign, ad group, ad, creative, and performance data.
                    </Text>
                    <Progress value={65} animated striped radius="xl" />
                    <Alert color="orange" radius="lg" variant="light" icon={<IconClock size={16} />}>
                      Keep this tab open until the sync finishes.
                    </Alert>
                  </>
                ) : (
                  <>
                    <Text size="sm" c="dimmed">
                      Choose which discovered {accountSelectionPlatform?.platformName ?? 'platform'} account DeepVisor should watch next. Saving this
                      selection also starts sync for that account.
                    </Text>

                    <Select
                      label={`Discovered ${accountSelectionPlatform?.platformName ?? 'platform'} accounts`}
                      placeholder={loadingAccountOptions ? 'Loading ad accounts...' : 'Select one ad account'}
                      data={accountOptions}
                      value={selectedAccountExternalId}
                      onChange={setSelectedAccountExternalId}
                      disabled={loadingAccountOptions}
                      searchable
                      nothingFoundMessage="No discovered ad accounts found"
                    />

                    {accountSelectionPlatform ? (
                      <Text size="sm" c="dimmed">
                        Current primary account:{' '}
                        {accountSelectionPlatform.primaryAdAccountName ||
                          accountSelectionPlatform.primaryAdAccountExternalId ||
                          'Not selected yet'}
                      </Text>
                    ) : null}

                    <Group justify="flex-end" gap="sm">
                      <Button
                        variant="default"
                        onClick={() => setAccountSelectionPlatform(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSelectAdAccount}
                        disabled={!selectedAccountExternalId || loadingAccountOptions}
                      >
                        Save and sync account
                      </Button>
                    </Group>
                  </>
                )}
              </Stack>
            </Modal>

            <Modal
              opened={Boolean(selectedPlatform)}
              onClose={() => setSelectedPlatform(null)}
              size="lg"
              withCloseButton={false}
              centered
            >
              {selectedPlatform ? (
                (() => {
                  const palette = getIntegrationPlatformPalette(selectedPlatform.platformKey);
                  const disconnecting = disconnectingPlatformId === selectedPlatform.id;
                  const connected = isIntegrationConnected(selectedPlatform.status);
                  const canConnectNow = canPlatformConnectNow(selectedPlatform);
                  const canChangeAccount =
                    (selectedPlatform.platformKey === 'meta' || selectedPlatform.platformKey === 'google') &&
                    connected &&
                    selectedPlatform.discoveredAdAccountCount > 1;

                  return (
                    <Stack gap="lg">
                      <Paper
                        withBorder
                        radius="xl"
                        p="xl"
                        className={styles.detailHero}
                        style={{
                          background: palette.accentSurface,
                          borderColor: palette.border,
                        }}
                      >
                        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
                          <Group gap="md" wrap="nowrap" align="flex-start">
                            <ChannelArtwork platform={selectedPlatform} size={96} />
                            <div>
                              <Group gap="xs" wrap="wrap" mb={8}>
                              <Text fw={700} size="xl" style={{ color: palette.text }}>
                                  {selectedPlatform.platformName}
                                </Text>
                                <Badge
                                  color={getIntegrationStatusColor(selectedPlatform.status)}
                                  variant={connected ? 'light' : 'outline'}
                                >
                                  {getIntegrationStatusLabel(selectedPlatform.status)}
                                </Badge>
                  
                              </Group>
                              <Text size="sm" maw={460}>
                                {selectedPlatform.fullDescription ||
                                  selectedPlatform.description ||
                                  'No detailed description available yet.'}
                              </Text>
                            </div>
                          </Group>

                          <Button variant="subtle" onClick={() => setSelectedPlatform(null)}>
                            Close
                          </Button>
                        </Group>
                      </Paper>

                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        <Paper withBorder radius="lg" p="md" className={styles.metricCard}>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            Connected on
                          </Text>
                          <Text fw={700} mt={4}>
                            {formatDateTime(selectedPlatform.connectedAt)}
                          </Text>
                        </Paper>

                        <Paper withBorder radius="lg" p="md" className={styles.metricCard}>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            Last sync
                          </Text>
                          <Text fw={700} mt={4}>
                            {formatDateTime(selectedPlatform.lastSyncedAt)}
                          </Text>
                        </Paper>

                        <Paper withBorder radius="lg" p="md" className={styles.metricCard}>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            Current status
                          </Text>
                          <Text fw={700} mt={4}>
                            {getIntegrationStatusLabel(selectedPlatform.status)}
                          </Text>
                        </Paper>

                        <Paper withBorder radius="lg" p="md" className={styles.metricCard}>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            Last updated
                          </Text>
                          <Text fw={700} mt={4}>
                            {formatDateTime(selectedPlatform.updatedAt)}
                          </Text>
                        </Paper>

                        <Paper withBorder radius="lg" p="md" className={styles.metricCard}>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            Sync rule
                          </Text>
                          <Text fw={700} mt={4}>
                            One primary ad account
                          </Text>
                        </Paper>

                        <Paper withBorder radius="lg" p="md" className={styles.metricCard}>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            Channel readiness
                          </Text>
                          <Text fw={700} mt={4}>
                            {getIntegrationAvailabilityCopy(selectedPlatform)}
                          </Text>
                        </Paper>
                      </SimpleGrid>

                      {(selectedPlatform.platformKey === 'meta' || selectedPlatform.platformKey === 'google') && connected ? (
                        <div>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            Primary ad account
                          </Text>
                          <Group gap="xs" mt="sm" wrap="wrap">
                            <Button
                              radius="xl"
                              variant="default"
                              onClick={
                                canChangeAccount
                                  ? () => void handleOpenAccountSelection(selectedPlatform)
                                  : undefined
                              }
                            >
                              {selectedPlatform.primaryAdAccountName ||
                                selectedPlatform.primaryAdAccountExternalId ||
                                'Not selected yet'}
                            </Button>
                            <Text size="sm" c="dimmed">
                              {selectedPlatform.discoveredAdAccountCount > 1
                                ? `${selectedPlatform.discoveredAdAccountCount} discovered ad accounts can be switched and synced from here.`
                                : selectedPlatform.discoveredAdAccountCount === 1
                                  ? 'Only one discovered ad account is currently available.'
                                  : `No saved ${selectedPlatform.platformName} accounts have been discovered yet.`}
                            </Text>
                          </Group>
                        </div>
                      ) : null}

                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        <Paper withBorder radius="lg" p="md">
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            Strengths
                          </Text>
                          <Text size="sm" mt="sm">
                            {selectedPlatform.strengths ||
                              'Strengths summary is not available yet for this platform.'}
                          </Text>
                        </Paper>

                        <Paper withBorder radius="lg" p="md">
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            Watchouts
                          </Text>
                          <Text size="sm" mt="sm">
                            {selectedPlatform.weaknesses ||
                              'Known limitations are not available yet for this platform.'}
                          </Text>
                        </Paper>
                      </SimpleGrid>

                      {selectedPlatform.lastError ? (
                        <Alert
                          color="red"
                          radius="lg"
                          variant="light"
                          icon={<IconAlertTriangle size={16} />}
                        >
                          {selectedPlatform.lastError}
                        </Alert>
                      ) : null}

                      <Group justify="space-between" align="center" wrap="wrap">
                        <Group gap="sm" wrap="wrap">
                          {connected ? (
                            <>
                              <Button
                                leftSection={<IconRefresh size={16} />}
                                variant="light"
                                onClick={() => void handleRefreshConnections(selectedPlatform.platformKey)}
                                loading={refreshing}
                              >
                                Refresh data
                              </Button>
                              {canChangeAccount ? (
                                <Button
                                  variant="default"
                                  onClick={() => void handleOpenAccountSelection(selectedPlatform)}
                                >
                                  Change ad account
                                </Button>
                              ) : null}
                  
                              <Button
                                color="red"
                                variant="light"
                                leftSection={<IconTrash size={16} />}
                                onClick={() => handleDisconnect(selectedPlatform)}
                                loading={disconnecting}
                              >
                                Disconnect
                              </Button>
                            </>
                          ) : canConnectNow ? (
                            <Button
                              leftSection={<IconLink size={16} />}
                              onClick={() => {
                                connectPlatform(selectedPlatform, connectMeta);
                              }}
                              loading={selectedPlatform.platformKey === 'meta' ? connecting : connectingGoogle}
                            >
                              {integrationNeedsAttention(selectedPlatform.status)
                                ? `Reconnect ${selectedPlatform.platformName}`
                                : `Connect ${selectedPlatform.platformName}`}
                            </Button>
                          ) : (
                            <Button
                              leftSection={<IconLock size={16} />}
                              variant="light"
                              color="gray"
                              disabled
                            >
                              Preview only
                            </Button>
                          )}
                        </Group>

                        <Group gap={8}>
                          <ThemeIcon color="gray" variant="light" radius="xl">
                            <IconClock size={16} />
                          </ThemeIcon>
                          <Text size="sm" c="dimmed">
                            {getIntegrationAvailabilityCopy(selectedPlatform)}
                          </Text>
                        </Group>
                      </Group>
                    </Stack>
                  );
                })()
              ) : null}
            </Modal>
          </Stack>
        </Container>
      )}
    </MetaIntegrationFlow>
  );
}
