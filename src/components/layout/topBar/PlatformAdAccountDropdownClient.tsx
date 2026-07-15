'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Badge, Group, Menu, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { Check, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getPlatformIcon } from '@/components/utils/utils';
import { setSelection } from './setSelection';

interface PlatformAdAccountDropdownClientProps {
  businessId: string;
  platforms: Array<{ id: string; platform_name: string }>;
  adAccounts: Array<{
    id: string;
    name: string | null;
    platform_integration_id: string;
    external_account_id: string | null;
    last_synced?: string | null;
  }>;
  initialPlatformId?: string | null;
  initialAccountId?: string | null;
  variant?: 'desktop' | 'compact' | 'drawer';
}

type WorkspaceOption = {
  value: string;
  platformId: string | null;
  accountId: string | null;
  platformKey: string;
  platformLabel: string;
  accountLabel: string;
  accountIdentifier: string | null;
  preview: boolean;
};

const PLATFORM_LABELS: Record<string, string> = {
  meta: 'Meta',
  google: 'Google Ads',
  tiktok: 'TikTok Ads',
};

const PLATFORM_DISPLAY_ORDER = ['meta', 'google', 'tiktok'];

const EMPTY_WORKSPACE_OPTION: WorkspaceOption = {
  value: 'no-connected-platform',
  platformId: null,
  accountId: null,
  platformKey: 'meta',
  platformLabel: 'No platform',
  accountLabel: 'Connect an ad account',
  accountIdentifier: null,
  preview: false,
};

function formatPlatformLabel(platformKey: string): string {
  return PLATFORM_LABELS[platformKey] ?? platformKey.charAt(0).toUpperCase() + platformKey.slice(1);
}

function formatAccountIdentifier(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const compactValue = value.replace(/\s+/g, '');
  if (compactValue.length <= 6) {
    return value;
  }

  return `...${compactValue.slice(-4)}`;
}

function sortByPlatformOrder(options: WorkspaceOption[]): WorkspaceOption[] {
  return [...options].sort((left, right) => {
    const leftIndex = PLATFORM_DISPLAY_ORDER.indexOf(left.platformKey);
    const rightIndex = PLATFORM_DISPLAY_ORDER.indexOf(right.platformKey);
    const safeLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const safeRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

    if (safeLeft !== safeRight) {
      return safeLeft - safeRight;
    }

    const platformCompare = left.platformLabel.localeCompare(right.platformLabel);
    if (platformCompare !== 0) {
      return platformCompare;
    }

    return left.accountLabel.localeCompare(right.accountLabel);
  });
}

function resolvePlatformTheme(platformKey: string): 'default' | 'meta' | 'google' | 'tiktok' {
  switch (platformKey) {
    case 'meta':
    case 'facebook':
      return 'meta';
    case 'google':
      return 'google';
    case 'tiktok':
      return 'tiktok';
    default:
      return 'default';
  }
}

function formatAccountLine(option: WorkspaceOption): string {
  const identifier = formatAccountIdentifier(option.accountIdentifier);
  return identifier ? `${option.accountLabel} - ${identifier}` : option.accountLabel;
}

export default function PlatformAdAccountDropdownClient({
  platforms,
  businessId,
  adAccounts,
  initialPlatformId,
  initialAccountId,
  variant = 'desktop',
}: PlatformAdAccountDropdownClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const liveOptions = useMemo(() => {
    return sortByPlatformOrder(
      platforms.flatMap((platform): WorkspaceOption[] => {
        const platformKey = platform.platform_name.toLowerCase();
        const platformAccounts = adAccounts.filter(
          (account) => account.platform_integration_id === platform.id
        );

        if (platformAccounts.length === 0) {
          return [
            {
              value: `live:${platform.id}:none`,
              platformId: platform.id,
              accountId: null,
              platformKey,
              platformLabel: formatPlatformLabel(platformKey),
              accountLabel: 'No ad account selected',
              accountIdentifier: null,
              preview: false,
            } satisfies WorkspaceOption,
          ];
        }

        return platformAccounts.map(
          (account) =>
            ({
              value: `live:${platform.id}:${account.id}`,
              platformId: platform.id,
              accountId: account.id,
              platformKey,
              platformLabel: formatPlatformLabel(platformKey),
              accountLabel: account.name ?? account.external_account_id ?? 'Unnamed ad account',
              accountIdentifier: account.external_account_id,
              preview: false,
            }) satisfies WorkspaceOption
        );
      })
    );
  }, [adAccounts, platforms]);

  const previewOptions = useMemo<WorkspaceOption[]>(() => [], []);

  const workspaceOptions = useMemo(
    () => (liveOptions.length > 0 ? [...liveOptions, ...previewOptions] : [EMPTY_WORKSPACE_OPTION]),
    [liveOptions, previewOptions]
  );

  const resolvedInitialValue = useMemo(() => {
    const exactMatch = liveOptions.find(
      (option) => option.platformId === initialPlatformId && option.accountId === initialAccountId
    );

    if (exactMatch) {
      return exactMatch.value;
    }

    const platformMatch = liveOptions.find((option) => option.platformId === initialPlatformId);
    if (platformMatch) {
      return platformMatch.value;
    }

    return workspaceOptions[0]?.value ?? null;
  }, [initialAccountId, initialPlatformId, liveOptions, workspaceOptions]);

  const [selectedValue, setSelectedValue] = useState<string | null>(resolvedInitialValue);

  useEffect(() => {
    if (resolvedInitialValue && !workspaceOptions.some((option) => option.value === selectedValue)) {
      setSelectedValue(resolvedInitialValue);
    }

    if (!selectedValue && resolvedInitialValue) {
      setSelectedValue(resolvedInitialValue);
    }
  }, [resolvedInitialValue, selectedValue, workspaceOptions]);

  const selectedOption =
    workspaceOptions.find((option) => option.value === selectedValue) ??
    workspaceOptions[0] ??
    null;

  useEffect(() => {
    if (!selectedOption) {
      return;
    }

    const shell = document.querySelector<HTMLElement>('.app-platform-shell');
    if (!shell) {
      return;
    }

    shell.setAttribute('data-platform-theme', resolvePlatformTheme(selectedOption.platformKey));
  }, [selectedOption]);

  const handleWorkspaceSelect = (option: WorkspaceOption) => {
    if (option.value === selectedValue) {
      return;
    }

    setSelectedValue(option.value);

    if (option.preview || !option.platformId) {
      return;
    }

    startTransition(async () => {
      await setSelection({
        businessId,
        platformId: option.platformId,
        accountRowId: option.accountId,
      });
      router.refresh();
    });
  };

  if (!selectedOption) {
    return null;
  }

  const hasPreviewOptions = previewOptions.length > 0;
  const selectedIcon = getPlatformIcon(selectedOption.platformKey, 18);
  const accentColor = 'var(--platform-accent)';
  const accentStrong = 'var(--platform-accent-strong)';
  const accentSoft = 'var(--platform-accent-soft)';
  const accentSoftStrong = 'var(--platform-accent-soft-strong)';
  const borderColor = 'var(--platform-border)';
  const compact = variant === 'compact';
  const drawer = variant === 'drawer';
  const menuWidth = compact || drawer ? 'min(calc(100vw - 24px), 360px)' : 360;

  return (
    <Menu shadow="md" width={menuWidth} position={compact ? 'bottom' : 'bottom-start'}>
      <Menu.Target>
        <UnstyledButton
          className="dv-platform-selector"
          disabled={isPending}
          style={{
            width: compact || drawer ? '100%' : undefined,
            minWidth: compact ? 0 : drawer ? '100%' : 290,
            padding: compact ? '8px 10px' : '10px 14px',
            borderRadius: compact ? 12 : 14,
          }}
        >
          <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
            <Group align="center" wrap="nowrap" gap="sm">
              <ThemeIcon
                size={compact ? 'md' : 'lg'}
                radius="xl"
                variant="filled"
                style={{
                  backgroundColor: selectedOption.preview ? 'rgba(148, 163, 184, 0.14)' : accentSoftStrong,
                  color: selectedOption.preview ? '#64748b' : accentStrong,
                  border: selectedOption.preview ? '1px solid rgba(148, 163, 184, 0.24)' : `1px solid ${borderColor}`,
                }}
              >
                {selectedIcon}
              </ThemeIcon>

              <div style={{ minWidth: 0, flex: 1 }}>
                <Group gap={6} wrap={compact ? 'nowrap' : 'wrap'}>
                  <Text size={compact ? 'xs' : 'sm'} fw={700} lineClamp={1}>
                    {selectedOption.platformLabel}
                  </Text>
                  {selectedOption.preview && !compact ? (
                    <Badge size="xs" color="gray" variant="light">
                      Preview
                    </Badge>
                  ) : null}
                </Group>
                <Text size="xs" c="dimmed" lineClamp={1} className="dv-platform-selector-muted">
                  {formatAccountLine(selectedOption)}
                </Text>
              </div>
            </Group>

            <ChevronDown className="dv-platform-selector-chevron" size={16} strokeWidth={1.6} />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Platforms & ad accounts</Menu.Label>
        <Text size="xs" c="dimmed" px="sm" pb="xs">
          Switch the workspace view by platform and ad account. Connected rows use the synced
          account data stored in DeepVisor.
        </Text>
        {hasPreviewOptions ? (
          <Text size="xs" c="dimmed" px="sm" pb="sm">
            Preview rows are static until those integrations are connected for real.
          </Text>
        ) : null}

        {workspaceOptions.map((option) => {
          const isActive = option.value === selectedOption.value;
          const optionIcon = getPlatformIcon(option.platformKey, 18);

          return (
            <Menu.Item key={option.value} onClick={() => handleWorkspaceSelect(option)}>
              <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                <Group align="center" wrap="nowrap" gap="sm">
                  <ThemeIcon
                    size="lg"
                    radius="xl"
                    variant="filled"
                    style={{
                      backgroundColor: option.preview ? 'rgba(148, 163, 184, 0.14)' : accentSoft,
                      color: option.preview ? '#64748b' : accentColor,
                      border: option.preview ? '1px solid rgba(148, 163, 184, 0.24)' : `1px solid ${borderColor}`,
                    }}
                  >
                    {optionIcon}
                  </ThemeIcon>

                  <div style={{ minWidth: 0 }}>
                    <Group gap={6} wrap="wrap">
                      <Text size="sm" fw={700} lineClamp={1}>
                        {option.platformLabel}
                      </Text>
                      {option.preview ? (
                        <Badge size="xs" color="gray" variant="light">
                          Preview
                        </Badge>
                      ) : null}
                    </Group>
                    <Text size="xs" c="dimmed" lineClamp={1} className="dv-platform-selector-muted">
                      {formatAccountLine(option)}
                    </Text>
                  </div>
                </Group>

                {isActive ? <Check size={16} color={accentColor} strokeWidth={1.8} /> : null}
              </Group>
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
