import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import {
  persistSelectedWorkspacePreference,
  setSelectedWorkspaceCookies,
} from '@/lib/server/actions/app/workspace-selection';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import {
  invalidateOrganizationBusinessContext,
} from '@/lib/server/actions/business/context';
import { createServerClient } from '@/lib/server/supabase/server';
import { createAdminClient } from '@/lib/server/supabase/admin';
import type { Database } from '@/lib/shared/types/supabase';
import {
  BUSINESS_TYPE_OPTIONS,
  MARKETING_GOAL_OPTIONS,
  MONTHLY_AD_BUDGET_OPTIONS,
  PLATFORM_OPTIONS,
  REPORTING_PREFERENCE_OPTIONS,
  ROLE_OPTIONS,
  optionValues,
  type OnboardingOption,
} from '@/lib/shared/onboarding/businessProfileOptions';

type OrganizationType = Database['public']['Enums']['organization_type'];

function optionalEnum(options: OnboardingOption[]) {
  return z
    .string()
    .trim()
    .refine((value) => value === '' || optionValues(options).includes(value), 'Invalid option')
    .optional();
}

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(['business', 'agency']).default('business'),
  website: z.string().trim().max(300).optional(),
  role: optionalEnum(ROLE_OPTIONS),
  businessType: optionalEnum(BUSINESS_TYPE_OPTIONS),
  monthlyBudget: optionalEnum(MONTHLY_AD_BUDGET_OPTIONS),
  preferredPlatforms: z
    .array(z.string())
    .refine(
      (value) => value.every((item) => optionValues(PLATFORM_OPTIONS).includes(item)),
      'Invalid platform selection'
    )
    .optional(),
  adGoals: z
    .array(z.string())
    .refine(
      (value) => value.every((item) => optionValues(MARKETING_GOAL_OPTIONS).includes(item)),
      'Invalid goal selection'
    )
    .optional(),
  reportingPreference: optionalEnum(REPORTING_PREFERENCE_OPTIONS),
});

type MembershipRow = {
  organization_id: string | null;
  role: string | null;
  organizations:
    | {
        id: string;
        name: string;
        type: OrganizationType;
        business_profiles?: Array<{
          id: string;
          business_name: string | null;
          onboarding_completed: boolean;
          onboarding_step: number;
        }> | null;
      }
    | Array<{
        id: string;
        name: string;
        type: OrganizationType;
        business_profiles?: Array<{
          id: string;
          business_name: string | null;
          onboarding_completed: boolean;
          onboarding_step: number;
        }> | null;
      }>
    | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function GET() {
  const { user, organizationId } = await getRequiredAppContext(false);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('organization_memberships')
    .select(
      `
      organization_id,
      role,
      organizations!organization_memberships_org_fkey (
        id,
        name,
        type,
        business_profiles (
          id,
          business_name,
          onboarding_completed,
          onboarding_step
        )
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to load workspaces' }, { status: 500 });
  }

  const workspaces = ((data ?? []) as unknown as MembershipRow[])
    .map((membership) => {
      const organization = first(membership.organizations);
      const business = first(organization?.business_profiles);
      if (!organization || !business) return null;

      return {
        organizationId: organization.id,
        organizationName: organization.name,
        organizationType: organization.type,
        businessId: business.id,
        businessName: business.business_name ?? organization.name,
        role: membership.role ?? 'member',
        onboardingCompleted: business.onboarding_completed,
        onboardingStep: business.onboarding_step,
        selected: organization.id === organizationId,
      };
    })
    .filter((workspace): workspace is NonNullable<typeof workspace> => workspace !== null);

  return NextResponse.json({ workspaces });
}

export async function POST(request: NextRequest) {
  const { user } = await getRequiredAppContext(false);
  const body = await request.json().catch(() => null);
  const parsed = createWorkspaceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid workspace payload', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const serverSupabase = await createServerClient();
  const { data: organizationId, error: organizationError } = await serverSupabase.rpc(
    'create_organization_with_owner',
    {
      org_name: parsed.data.name,
      org_type: parsed.data.type,
      org_primary_language: 'en',
    }
  );

  if (organizationError || !organizationId) {
    return NextResponse.json(
      { error: organizationError?.message || 'Failed to create workspace' },
      { status: 500 }
    );
  }

  const providedFullSetup = Boolean(
    parsed.data.businessType &&
      parsed.data.monthlyBudget &&
      parsed.data.preferredPlatforms?.length &&
      parsed.data.adGoals?.length &&
      parsed.data.reportingPreference
  );

  const adminSupabase = createAdminClient();
  const { data: business, error: businessError } = await adminSupabase
    .from('business_profiles')
    .insert({
      organization_id: organizationId,
      business_name: parsed.data.name,
      website: parsed.data.website?.trim() || null,
      industry: parsed.data.businessType || null,
      monthly_budget: parsed.data.monthlyBudget || null,
      preferred_platforms: parsed.data.preferredPlatforms ?? [],
      ad_goals: parsed.data.adGoals ?? [],
      most_valuable_service: parsed.data.adGoals?.[0] ?? null,
      primary_goal: parsed.data.adGoals?.[0] ?? null,
      description: parsed.data.role
        ? [`Role: ${parsed.data.role}`, `Reporting preference: ${parsed.data.reportingPreference ?? ''}`].join('\n')
        : null,
      onboarding_step: providedFullSetup ? 6 : 0,
      onboarding_completed: providedFullSetup,
    })
    .select('id, onboarding_completed, onboarding_step')
    .single();

  if (businessError || !business) {
    return NextResponse.json(
      { error: businessError?.message || 'Workspace was created, but business setup failed' },
      { status: 500 }
    );
  }

  await persistSelectedWorkspacePreference({
    userId: user.id,
    organizationId,
  });
  await logAuditEvent(adminSupabase, {
    businessId: business.id,
    organizationId,
    actorUserId: user.id,
    eventType: 'workspace.created',
    resourceType: 'organization',
    resourceId: organizationId,
    metadata: {
      organizationType: parsed.data.type,
      businessName: parsed.data.name,
    },
  });
  await logAuditEvent(adminSupabase, {
    businessId: business.id,
    organizationId,
    actorUserId: user.id,
    eventType: 'workspace.selected',
    resourceType: 'organization',
    resourceId: organizationId,
    metadata: {
      source: 'workspace_create',
    },
  });
  await invalidateOrganizationBusinessContext(user.id, organizationId);

  const response = NextResponse.json({
    workspace: {
      organizationId,
      organizationName: parsed.data.name,
      organizationType: parsed.data.type,
      businessId: business.id,
      role: 'owner',
      onboardingCompleted: business.onboarding_completed,
      onboardingStep: business.onboarding_step,
    },
  });

  return setSelectedWorkspaceCookies(response, {
    organizationId,
    clearAccountSelection: true,
  });
}
