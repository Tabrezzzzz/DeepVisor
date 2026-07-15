export type OnboardingOption = {
  value: string;
  label: string;
};

export const ROLE_OPTIONS: OnboardingOption[] = [
  { value: 'founder_owner', label: 'Founder / Owner' },
  { value: 'agency_owner', label: 'Agency Owner' },
  { value: 'performance_marketer', label: 'Performance Marketer' },
  { value: 'marketing_manager', label: 'Marketing Manager' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'sales_marketing_head', label: 'Sales & Marketing Head' },
  { value: 'other', label: 'Other' },
];

export const BUSINESS_TYPE_OPTIONS: OnboardingOption[] = [
  { value: 'marketing_agency', label: 'Marketing Agency' },
  { value: 'b2b_company', label: 'B2B Company' },
  { value: 'local_service_business', label: 'Local Service Business' },
  { value: 'ecommerce', label: 'Ecommerce' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'healthcare_clinic', label: 'Healthcare / Clinic' },
  { value: 'education_coaching', label: 'Education / Coaching' },
  { value: 'saas_software', label: 'SaaS / Software' },
  { value: 'other', label: 'Other' },
];

export const MONTHLY_AD_BUDGET_OPTIONS: OnboardingOption[] = [
  { value: 'below_50000_inr', label: 'Below ₹50,000' },
  { value: '50000_200000_inr', label: '₹50,000 - ₹2,00,000' },
  { value: '200000_1000000_inr', label: '₹2,00,000 - ₹10,00,000' },
  { value: '1000000_5000000_inr', label: '₹10,00,000 - ₹50,00,000' },
  { value: 'above_5000000_inr', label: 'Above ₹50,00,000' },
];

export const PLATFORM_OPTIONS: OnboardingOption[] = [
  { value: 'meta', label: 'Meta Ads' },
  { value: 'google', label: 'Google Ads' },
  { value: 'linkedin', label: 'LinkedIn Ads' },
  { value: 'tiktok', label: 'TikTok Ads' },
  { value: 'youtube', label: 'YouTube Ads' },
  { value: 'other', label: 'Other' },
];

export const MARKETING_GOAL_OPTIONS: OnboardingOption[] = [
  { value: 'reduce_wasted_spend', label: 'Reduce wasted spend' },
  { value: 'improve_roas', label: 'Improve ROAS' },
  { value: 'lower_cpl', label: 'Lower CPL' },
  { value: 'improve_lead_quality', label: 'Improve lead quality' },
  { value: 'track_campaign_performance', label: 'Track campaign performance' },
  { value: 'automate_reports', label: 'Automate reports' },
  { value: 'manage_client_reporting', label: 'Manage client reporting' },
  { value: 'detect_creative_fatigue', label: 'Detect creative fatigue' },
  { value: 'review_ai_recommendations', label: 'Review AI recommendations before action' },
];

export const REPORTING_PREFERENCE_OPTIONS: OnboardingOption[] = [
  { value: 'weekly_executive_summary', label: 'Weekly executive summary' },
  { value: 'monthly_client_report', label: 'Monthly client report' },
  { value: 'daily_spend_alert', label: 'Daily spend alert' },
  { value: 'campaign_review_only', label: 'Campaign review only' },
  { value: 'custom', label: 'Custom' },
];

export const WATCH_SIGNAL_OPTIONS: OnboardingOption[] = [
  { value: 'wasted_spend', label: 'Wasted spend' },
  { value: 'high_cpl', label: 'High CPL' },
  { value: 'roas_drop', label: 'ROAS drop' },
  { value: 'lead_quality_issue', label: 'Lead quality issue' },
  { value: 'creative_fatigue', label: 'Creative fatigue' },
  { value: 'budget_pacing', label: 'Budget pacing' },
  { value: 'winner_detected', label: 'Campaign winner detected' },
  { value: 'scale_candidates', label: 'Budget shift opportunity' },
];

export const RECOMMENDATION_STYLE_OPTIONS: OnboardingOption[] = [
  { value: 'insights_only', label: 'Show insights only' },
  { value: 'recommend_actions_for_approval', label: 'Recommend actions for approval' },
  { value: 'create_drafts_for_review', label: 'Create drafts for review' },
];

export const SAFETY_PREFERENCE_OPTIONS: OnboardingOption[] = [
  { value: 'very_cautious', label: 'Very cautious' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'growth_focused', label: 'Growth-focused' },
];

export const DEFAULT_WATCH_SIGNALS = [
  'wasted_spend',
  'high_cpl',
  'roas_drop',
  'lead_quality_issue',
  'creative_fatigue',
  'winner_detected',
];

export const DEFAULT_INTELLIGENCE_GOALS = {
  primaryGoal: 'track_campaign_performance',
  leadType: 'qualified_leads',
  preferredContactMethod: 'lead_form',
  leadQualitySignal: 'qualified_opportunity',
  recommendationStyle: 'recommend_actions_for_approval',
  safetyPreference: 'balanced',
} as const;

export const SALON_INDUSTRY_OPTIONS = BUSINESS_TYPE_OPTIONS;
export const CUSTOMER_RADIUS_OPTIONS: OnboardingOption[] = [];
export const SALON_SERVICE_OPTIONS = MARKETING_GOAL_OPTIONS;
export const SALON_MOST_VALUABLE_SERVICE_OPTIONS = MARKETING_GOAL_OPTIONS;
export const META_ADS_STATUS_OPTIONS = PLATFORM_OPTIONS;
export const INTELLIGENCE_GOAL_OPTIONS = MARKETING_GOAL_OPTIONS;
export const LEAD_TYPE_OPTIONS: OnboardingOption[] = [
  { value: 'qualified_leads', label: 'Qualified leads' },
  { value: 'sales_opportunities', label: 'Sales opportunities' },
  { value: 'form_submissions', label: 'Form submissions' },
  { value: 'calls', label: 'Calls' },
  { value: 'purchases', label: 'Purchases' },
];
export const CONTACT_METHOD_OPTIONS: OnboardingOption[] = [
  { value: 'lead_form', label: 'Lead form' },
  { value: 'website', label: 'Website' },
  { value: 'phone_calls', label: 'Phone calls' },
  { value: 'crm', label: 'CRM' },
  { value: 'whatsapp_messages', label: 'WhatsApp messages' },
];
export const LEAD_QUALITY_SIGNAL_OPTIONS: OnboardingOption[] = [
  { value: 'qualified_opportunity', label: 'Qualified opportunity' },
  { value: 'sales_accepted_lead', label: 'Sales accepted lead' },
  { value: 'booked_call', label: 'Booked call' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'pipeline_value', label: 'Pipeline value' },
];
export const AVERAGE_CUSTOMER_VALUE_OPTIONS: OnboardingOption[] = [
  { value: 'under_5000_inr', label: 'Under ₹5,000' },
  { value: '5000_25000_inr', label: '₹5,000 - ₹25,000' },
  { value: '25000_100000_inr', label: '₹25,000 - ₹1,00,000' },
  { value: '100000_plus_inr', label: '₹1,00,000+' },
  { value: 'not_sure', label: 'Not sure' },
];
export const TARGET_COST_PER_LEAD_OPTIONS: OnboardingOption[] = [
  { value: 'under_250_inr', label: 'Under ₹250' },
  { value: '250_500_inr', label: '₹250 - ₹500' },
  { value: '500_1000_inr', label: '₹500 - ₹1,000' },
  { value: '1000_plus_inr', label: '₹1,000+' },
  { value: 'recommend_for_me', label: 'Recommend for me' },
];

export function optionValues(options: OnboardingOption[]): string[] {
  return options.map((option) => option.value);
}

export function isAllowedOption(value: string | null | undefined, options: OnboardingOption[]): boolean {
  return typeof value === 'string' && optionValues(options).includes(value);
}

export function labelForOption(
  value: string | null | undefined,
  options: OnboardingOption[],
  fallback = 'Not set'
): string {
  if (!value) return fallback;
  return options.find((option) => option.value === value)?.label ?? fallback;
}
