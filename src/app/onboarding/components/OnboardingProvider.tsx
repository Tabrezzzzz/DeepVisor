'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  MultiSelect,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Stepper,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { Building2, CheckCircle2, FileText, Megaphone, Target, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import BlockingTaskScreen from '@/components/ui/states/BlockingTaskScreen';
import {
  BUSINESS_TYPE_OPTIONS,
  MARKETING_GOAL_OPTIONS,
  MONTHLY_AD_BUDGET_OPTIONS,
  PLATFORM_OPTIONS,
  REPORTING_PREFERENCE_OPTIONS,
  ROLE_OPTIONS,
  labelForOption,
} from '@/lib/shared/onboarding/businessProfileOptions';
import {
  updateBusinessProfileData,
  updateOnboardingProgress,
} from '@/lib/server/actions/business/onboarding';
import type { UserData } from './types';
import classes from './OnboardingProvider.module.css';
import type { OnboardingInitial } from '@/lib/server/actions/business/onboarding';

type OnboardingProviderProps = {
  initial: OnboardingInitial;
  userId: string;
};

const stepMeta = [
  { label: 'Workspace basics', icon: Building2 },
  { label: 'Business type', icon: Target },
  { label: 'Monthly ad spend', icon: Wallet },
  { label: 'Ad platforms', icon: Megaphone },
  { label: 'Main goals', icon: CheckCircle2 },
  { label: 'Reporting', icon: FileText },
];

const dropdownProps = {
  comboboxProps: {
    withinPortal: true,
    position: 'bottom-start' as const,
    zIndex: 400,
    middlewares: { flip: true, shift: true },
  },
  maxDropdownHeight: 280,
};

function cleanBusinessName(value: string) {
  return value.trim();
}

function allowedValues(options: Array<{ value: string }>) {
  return new Set(options.map((option) => option.value));
}

function filterAllowed(values: string[] | null | undefined, allowed: Set<string>) {
  return Array.from(new Set((values ?? []).filter((value) => allowed.has(value))));
}

export default function OnboardingProvider({ initial }: OnboardingProviderProps) {
  const router = useRouter();
  const allowedGoals = allowedValues(MARKETING_GOAL_OPTIONS);
  const allowedPlatforms = allowedValues(PLATFORM_OPTIONS);
  const allowedBusinessTypes = allowedValues(BUSINESS_TYPE_OPTIONS);
  const initialAdGoals = filterAllowed(
    [...(initial.businessData.adGoals ?? []), ...(initial.businessData.promotedServices ?? [])],
    allowedGoals
  );
  const initialPlatforms = filterAllowed(
    [...(initial.businessData.preferredPlatforms ?? []), ...(initial.connectedPlatformKeys ?? [])],
    allowedPlatforms
  );
  const initialBusinessType = allowedBusinessTypes.has(initial.businessData.industry ?? '')
    ? initial.businessData.industry ?? ''
    : '';
  const [active, setActive] = useState(() => Math.min(Math.max(initial.step ?? 0, 0), stepMeta.length - 1));
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserData>(() => ({
    businessName: initial.businessData.businessName || initial.organizationName || '',
    role: '',
    businessType: initialBusinessType,
    reportingPreference: '',
    industry: initialBusinessType,
    monthlyBudget: initial.businessData.monthlyBudget ?? '',
    website: initial.businessData.website ?? '',
    bookingLink: '',
    businessLocation: '',
    customerRadius: '',
    description: initial.businessData.description ?? '',
    promotedServices: initialAdGoals,
    mostValuableService: initialAdGoals[0] ?? '',
    metaAdsStatus: initial.businessData.metaAdsStatus ?? '',
    primaryGoal: initialAdGoals[0] ?? '',
    leadType: initial.businessData.leadType ?? '',
    preferredContactMethod: initial.businessData.preferredContactMethod ?? '',
    leadQualitySignal: initial.businessData.leadQualitySignal ?? '',
    averageCustomerValue: initial.businessData.averageCustomerValue ?? '',
    targetCostPerLead: initial.businessData.targetCostPerLead ?? '',
    watchSignals: initial.businessData.watchSignals ?? [],
    recommendationStyle: initial.businessData.recommendationStyle ?? 'recommend_actions_for_approval',
    safetyPreference: initial.businessData.safetyPreference ?? 'balanced',
    adGoals: initialAdGoals,
    preferredPlatforms: initialPlatforms,
    emailNotifications: true,
    weeklyReports: true,
    performanceAlerts: true,
    connectedPlatforms: initialPlatforms,
  }));

  const progressValue = useMemo(() => Math.round(((active + 1) / stepMeta.length) * 100), [active]);

  const update = (patch: Partial<UserData>) => setUserData((current) => ({ ...current, ...patch }));

  const persistStep = async (nextStep: number, completed = false) => {
    const res = await updateOnboardingProgress({ step: nextStep, completed });
    if (!res.success) toast.error(res.error.userMessage);
    return res.success;
  };

  const canContinue = () => {
    if (active === 0) return cleanBusinessName(userData.businessName).length > 0 && userData.role;
    if (active === 1) return Boolean(userData.businessType);
    if (active === 2) return Boolean(userData.monthlyBudget);
    if (active === 3) return userData.preferredPlatforms.length > 0;
    if (active === 4) return userData.adGoals.length > 0;
    if (active === 5) return Boolean(userData.reportingPreference);
    return true;
  };

  const next = async () => {
    if (!canContinue()) {
      toast.error('Complete this step before continuing.');
      return;
    }

    if (active < stepMeta.length - 1) {
      const nextStep = active + 1;
      setActive(nextStep);
      void persistStep(nextStep);
      return;
    }

    setLoading(true);
    try {
      const mainGoal = userData.adGoals[0] ?? 'track_campaign_performance';
      const primaryPlatform = userData.preferredPlatforms[0] ?? 'meta';
      const saveRes = await updateBusinessProfileData({
        businessName: cleanBusinessName(userData.businessName),
        website: userData.website,
        industry: userData.businessType,
        monthlyBudget: userData.monthlyBudget,
        description: [
          `Role: ${labelForOption(userData.role, ROLE_OPTIONS)}`,
          `Reporting preference: ${labelForOption(userData.reportingPreference, REPORTING_PREFERENCE_OPTIONS)}`,
          'Workspace type: performance marketing command center',
        ].join('\n'),
        promotedServices: userData.adGoals,
        mostValuableService: mainGoal,
        metaAdsStatus: primaryPlatform,
        primaryGoal: mainGoal,
        adGoals: userData.adGoals,
        preferredPlatforms: userData.preferredPlatforms,
        watchSignals: [
          userData.adGoals.includes('reduce_wasted_spend') ? 'wasted_spend' : null,
          userData.adGoals.includes('lower_cpl') ? 'high_cpl' : null,
          userData.adGoals.includes('improve_roas') ? 'roas_drop' : null,
          userData.adGoals.includes('detect_creative_fatigue') ? 'creative_fatigue' : null,
        ].filter((value): value is string => Boolean(value)),
        recommendationStyle: 'recommend_actions_for_approval',
        safetyPreference: 'balanced',
      });

      if (!saveRes.success) {
        toast.error(saveRes.error.userMessage);
        return;
      }

      const progressSaved = await persistStep(stepMeta.length, true);
      if (progressSaved) {
        router.replace('/dashboard');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.onboardingPage}>
      <Container size="lg" className={classes.onboardingShell}>
      <BlockingTaskScreen
        opened={loading}
        title="Preparing performance workspace"
        description="DeepVisor is saving your workspace, reports, insights, and approval queue preferences."
      />

      <Card withBorder radius="lg" p="xl" className={`dv-command-panel ${classes.formCard}`}>
        <Group justify="space-between" align="flex-start" gap="xl" mb="xl">
          <div>
            <Badge className="dv-accent-badge" radius="xl">Workspace setup</Badge>
            <Title order={1} mt="sm">Create your performance marketing workspace</Title>
            <Text c="dimmed" maw={680} mt="xs">
              Configure DeepVisor around ad spend, ROAS, CPL, lead quality, reports, and approval-ready next actions.
            </Text>
          </div>
          <Stack gap={6} align="flex-end">
            <Text size="sm" fw={800}>Step {active + 1} of {stepMeta.length}</Text>
            <Progress value={progressValue} w={180} color="orange" radius="xl" />
          </Stack>
        </Group>

        <Stepper active={active} onStepClick={setActive} size="sm" color="orange">
          {stepMeta.map((step) => {
            const Icon = step.icon;
            return (
              <Stepper.Step
                key={step.label}
                label={step.label}
                icon={<Icon size={15} strokeWidth={1.7} />}
              />
            );
          })}
        </Stepper>

        <div className="mt-8">
          {active === 0 ? (
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
              <TextInput
                label="Company name"
                placeholder="Acme Growth Studio"
                value={userData.businessName}
                onChange={(event) => update({ businessName: event.currentTarget.value })}
                required
              />
              <TextInput
                label="Website"
                placeholder="https://company.com"
                value={userData.website}
                onChange={(event) => update({ website: event.currentTarget.value })}
              />
              <Select
                label="User role"
                placeholder="Select role"
                data={ROLE_OPTIONS}
                value={userData.role}
                onChange={(value) => update({ role: value ?? '' })}
                required
                {...dropdownProps}
              />
            </SimpleGrid>
          ) : null}

          {active === 1 ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {BUSINESS_TYPE_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`dv-choice-card ${userData.businessType === option.value ? 'is-selected' : ''}`}
                  onClick={() => update({ businessType: option.value, industry: option.value })}
                >
                  <span>{option.label}</span>
                </button>
              ))}
            </SimpleGrid>
          ) : null}

          {active === 2 ? (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="md">
              {MONTHLY_AD_BUDGET_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={`dv-choice-card ${userData.monthlyBudget === option.value ? 'is-selected' : ''}`}
                  onClick={() => update({ monthlyBudget: option.value })}
                >
                  <Wallet size={18} strokeWidth={1.6} />
                  <span>{option.label}</span>
                </button>
              ))}
            </SimpleGrid>
          ) : null}

          {active === 3 ? (
            <MultiSelect
              label="Ad platforms"
              placeholder="Select platforms"
              data={PLATFORM_OPTIONS}
              value={userData.preferredPlatforms}
              onChange={(value) => update({ preferredPlatforms: value })}
              required
              searchable
              {...dropdownProps}
            />
          ) : null}

          {active === 4 ? (
            <MultiSelect
              label="Main goals"
              placeholder="Select goals"
              data={MARKETING_GOAL_OPTIONS}
              value={userData.adGoals}
              onChange={(value) => update({ adGoals: value, promotedServices: value, primaryGoal: value[0] ?? '' })}
              required
              searchable
              {...dropdownProps}
            />
          ) : null}

          {active === 5 ? (
            <Stack gap="lg">
              <Select
                label="Reporting preference"
                placeholder="Choose reporting cadence"
                data={REPORTING_PREFERENCE_OPTIONS}
                value={userData.reportingPreference}
                onChange={(value) => update({ reportingPreference: value ?? '' })}
                required
                {...dropdownProps}
              />
              <Card withBorder radius="md" p="lg" className="dv-ready-card">
                <Group gap="md" align="flex-start">
                  <ThemeIcon color="orange" variant="light" radius="md">
                    <CheckCircle2 size={18} strokeWidth={1.7} />
                  </ThemeIcon>
                  <div>
                    <Title order={3}>Your performance workspace is ready</Title>
                    <Text c="dimmed" mt={4}>
                      DeepVisor will now prepare your dashboard, reports, insights, and approval queue based on your campaign goals.
                    </Text>
                  </div>
                </Group>
              </Card>
            </Stack>
          ) : null}
        </div>

        <Group justify="space-between" mt="xl">
          <Button variant="default" disabled={active === 0 || loading} onClick={() => setActive((value) => Math.max(0, value - 1))}>
            Back
          </Button>
          <Button color="orange" onClick={next} loading={loading}>
            {active === stepMeta.length - 1 ? 'Go to dashboard' : 'Continue'}
          </Button>
        </Group>
      </Card>
      </Container>
    </div>
  );
}
