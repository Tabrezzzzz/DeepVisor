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
} from '@/lib/shared/onboarding/businessProfileOptions';
import classes from '../../../onboarding/components/OnboardingProvider.module.css';

type WorkspaceFormData = {
  organizationType: 'business' | 'agency';
  businessName: string;
  website: string;
  role: string;
  businessType: string;
  monthlyBudget: string;
  preferredPlatforms: string[];
  adGoals: string[];
  reportingPreference: string;
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

const ORGANIZATION_TYPE_OPTIONS = [
  { value: 'business', label: 'Business' },
  { value: 'agency', label: 'Agency' },
];

function cleanBusinessName(value: string) {
  return value.trim();
}

export default function WorkspaceCreateClient() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<WorkspaceFormData>({
    organizationType: 'business',
    businessName: '',
    website: '',
    role: '',
    businessType: '',
    monthlyBudget: '',
    preferredPlatforms: [],
    adGoals: [],
    reportingPreference: '',
  });

  const progressValue = useMemo(() => Math.round(((active + 1) / stepMeta.length) * 100), [active]);

  const update = (patch: Partial<WorkspaceFormData>) =>
    setFormData((current) => ({ ...current, ...patch }));

  const canContinue = () => {
    if (active === 0) return cleanBusinessName(formData.businessName).length > 0 && Boolean(formData.role);
    if (active === 1) return Boolean(formData.businessType);
    if (active === 2) return Boolean(formData.monthlyBudget);
    if (active === 3) return formData.preferredPlatforms.length > 0;
    if (active === 4) return formData.adGoals.length > 0;
    if (active === 5) return Boolean(formData.reportingPreference);
    return true;
  };

  const next = async () => {
    if (!canContinue()) {
      toast.error('Complete this step before continuing.');
      return;
    }

    if (active < stepMeta.length - 1) {
      setActive((value) => value + 1);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanBusinessName(formData.businessName),
          type: formData.organizationType,
          website: formData.website,
          role: formData.role,
          businessType: formData.businessType,
          monthlyBudget: formData.monthlyBudget,
          preferredPlatforms: formData.preferredPlatforms,
          adGoals: formData.adGoals,
          reportingPreference: formData.reportingPreference,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        toast.error(payload?.error || 'Failed to create workspace');
        return;
      }

      router.replace('/dashboard');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.onboardingPage}>
      <Container size="lg" className={classes.onboardingShell}>
        <BlockingTaskScreen
          opened={loading}
          title="Creating workspace"
          description="DeepVisor is setting up your new workspace, reports, insights, and approval queue preferences."
        />

        <Card withBorder radius="lg" p="xl" className={`dv-command-panel ${classes.formCard}`}>
          <Group justify="space-between" align="flex-start" gap="xl" mb="xl">
            <div>
              <Badge className="dv-accent-badge" radius="xl">New workspace</Badge>
              <Title order={1} mt="sm">Create a new workspace</Title>
              <Text c="dimmed" maw={680} mt="xs">
                Set up another performance marketing workspace with its own ad spend, ROAS, CPL, lead quality,
                reports, and approval-ready next actions.
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
              <Stack gap="md">
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <Select
                    label="Workspace type"
                    data={ORGANIZATION_TYPE_OPTIONS}
                    value={formData.organizationType}
                    onChange={(value) =>
                      update({ organizationType: (value as 'business' | 'agency') ?? 'business' })
                    }
                    required
                    {...dropdownProps}
                  />
                </SimpleGrid>
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                  <TextInput
                    label="Company name"
                    placeholder="Acme Growth Studio"
                    value={formData.businessName}
                    onChange={(event) => update({ businessName: event.currentTarget.value })}
                    required
                  />
                  <TextInput
                    label="Website"
                    placeholder="https://company.com"
                    value={formData.website}
                    onChange={(event) => update({ website: event.currentTarget.value })}
                  />
                  <Select
                    label="User role"
                    placeholder="Select role"
                    data={ROLE_OPTIONS}
                    value={formData.role}
                    onChange={(value) => update({ role: value ?? '' })}
                    required
                    {...dropdownProps}
                  />
                </SimpleGrid>
              </Stack>
            ) : null}

            {active === 1 ? (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {BUSINESS_TYPE_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={`dv-choice-card ${formData.businessType === option.value ? 'is-selected' : ''}`}
                    onClick={() => update({ businessType: option.value })}
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
                    className={`dv-choice-card ${formData.monthlyBudget === option.value ? 'is-selected' : ''}`}
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
                value={formData.preferredPlatforms}
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
                value={formData.adGoals}
                onChange={(value) => update({ adGoals: value })}
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
                  value={formData.reportingPreference}
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
                      <Title order={3}>Your new workspace is ready</Title>
                      <Text c="dimmed" mt={4}>
                        DeepVisor will now create the workspace and switch you into it.
                      </Text>
                    </div>
                  </Group>
                </Card>
              </Stack>
            ) : null}
          </div>

          <Group justify="space-between" mt="xl">
            <Button
              variant="default"
              disabled={active === 0 || loading}
              onClick={() => setActive((value) => Math.max(0, value - 1))}
            >
              Back
            </Button>
            <Button color="orange" onClick={next} loading={loading}>
              {active === stepMeta.length - 1 ? 'Create workspace' : 'Continue'}
            </Button>
          </Group>
        </Card>
      </Container>
    </div>
  );
}
