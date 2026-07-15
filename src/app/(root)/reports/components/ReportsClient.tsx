'use client';

import '@mantine/charts/styles.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

import { BarChart, ChartTooltip, LineChart } from '@mantine/charts';
import {
  Accordion,
  Badge,
  Button,
  Card,
  Container,
  Drawer,
  Grid,
  Group,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconChartBar,
  IconChevronRight,
  IconTimeline,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Fragment, useEffect, useMemo, useState, useTransition } from 'react';
import { buildReportUrl, CHART_METRIC_COLORS, formatChartDateLabel } from '@/lib/shared';
import type {
  DashboardAudienceSlice,
  DashboardPlatformSlice,
  DashboardTrendPoint,
} from '@/lib/server/dashboard/types';
import type {
  ReportBreakdownRow,
  ReportFilterOptions,
  ReportKpi,
  ReportMetricTotals,
  ReportPayload,
  ReportTimeSeriesPoint,
} from '@/lib/server/reports/types';
import PerformanceTable from './cards/PerformanceTable';
import ReportsHeader from './layout/ReportsHeader';
import ReportsSidebar from './layout/ReportsSidebar';
import classes from './ReportsClient.module.css';

interface ReportsClientProps {
  payload: ReportPayload;
  filterOptions: ReportFilterOptions;
  isDemo?: boolean;
}

type ReportChartSeries = {
  name: string;
  color: string;
};

type TimelineAnnotation = {
  key: string;
  chartLabel: string;
  value: number;
  label: string;
  detail: string;
  color: string;
};

type FindingAnnotationBucket = 'timeline' | 'quality';

type ReportTooltipPayloadItem = {
  name?: string | number;
  dataKey?: string | number;
  value?: number | string | Array<number | string>;
  color?: string;
  fill?: string;
  stroke?: string;
};

type ReportTooltipContentProps = {
  active?: boolean;
  label?: string | number;
  payload?: ReportTooltipPayloadItem[];
};

const PERFORMANCE_TIMELINE_SERIES: ReportChartSeries[] = [
  { name: 'Spend', color: CHART_METRIC_COLORS.spend },
  { name: 'Results', color: CHART_METRIC_COLORS.results },
  { name: 'Clicks', color: CHART_METRIC_COLORS.clicks },
];

const EFFICIENCY_TIMELINE_SERIES: ReportChartSeries[] = [
  { name: 'CTR', color: CHART_METRIC_COLORS.ctr },
  { name: 'CPC', color: CHART_METRIC_COLORS.cpc },
  { name: 'CPM', color: CHART_METRIC_COLORS.cpm },
];

const FINDING_ANNOTATION_COLORS = {
  critical: '#e03131',
  warning: '#f08c00',
  info: '#fd4b23',
} as const;

const FINDING_SHORT_LABELS = {
  best_time_window: 'Best time',
  delivery_drop_vs_efficiency: 'Delivery drop',
  efficiency_drop_vs_delivery: 'Efficiency pressure',
  meaningful_crossover: 'Trend crossover',
  sustained_divergence: 'Sustained pressure',
  stale_live_delivery: 'Weak live delivery',
} as const;

const TIMELINE_FINDING_TYPES = new Set([
  'delivery_drop_vs_efficiency',
  'meaningful_crossover',
  'stale_live_delivery',
]);

function isIsoDateLabel(value: string | null | undefined) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function resolveFindingAnchorDate(finding: ReportPayload['findings'][number]) {
  if (isIsoDateLabel(finding.metricSnapshot.periodEnd)) {
    return finding.metricSnapshot.periodEnd;
  }

  if (isIsoDateLabel(finding.metricSnapshot.periodStart)) {
    return finding.metricSnapshot.periodStart;
  }

  if (isIsoDateLabel(finding.metricSnapshot.label)) {
    return finding.metricSnapshot.label;
  }

  if (isIsoDateLabel(finding.detectedAt.slice(0, 10))) {
    return finding.detectedAt.slice(0, 10);
  }

  return null;
}

function findSeriesPointForDate(
  series: ReportTimeSeriesPoint[],
  targetDate: string | null | undefined
) {
  if (!targetDate) {
    return null;
  }

  return (
    series.find((point) => point.startDate <= targetDate && point.endDate >= targetDate) ??
    series.find((point) => point.label === targetDate) ??
    null
  );
}

function resolveFindingAnnotationBucket(
  finding: ReportPayload['findings'][number]
): FindingAnnotationBucket {
  return TIMELINE_FINDING_TYPES.has(finding.findingType) ? 'timeline' : 'quality';
}

function buildFindingAnnotation(
  finding: ReportPayload['findings'][number],
  series: ReportTimeSeriesPoint[]
): { bucket: FindingAnnotationBucket; annotation: TimelineAnnotation } | null {
  const targetDate = resolveFindingAnchorDate(finding);
  const point = findSeriesPointForDate(series, targetDate);

  if (!point || !targetDate) {
    return null;
  }

  const bucket = resolveFindingAnnotationBucket(finding);
  const value =
    bucket === 'timeline'
      ? point.conversion > 0
        ? point.conversion
        : Number(point.spend.toFixed(2))
      : point.ctr > 0
        ? Number(point.ctr.toFixed(2))
        : point.cpc > 0
          ? Number(point.cpc.toFixed(2))
          : Number(point.cpm.toFixed(2));

  return {
    bucket,
    annotation: {
      key: `finding-${finding.id}`,
      chartLabel: formatChartDateLabel(targetDate),
      value,
      label: FINDING_SHORT_LABELS[finding.findingType] ?? 'Finding',
      detail: finding.summary,
      color: FINDING_ANNOTATION_COLORS[finding.severity],
    },
  };
}

type SurfacePanelMode = 'platform' | 'device' | 'geo' | 'times';
type AudienceChartType = 'default' | 'stacked';
type BreakdownMetric = 'results' | 'clicks' | 'spend';

type AudienceChartSeries = {
  name: string;
  color: string;
};

type MultiSeriesBarChartConfig = {
  data: Record<string, string | number>[];
  title: string;
  formatter: (value: number) => string;
  series: AudienceChartSeries[];
  withLegend: boolean;
};

type AudienceChartConfig = {
  data: Record<string, string | number>[];
  title: string;
  formatter: (value: number) => string;
  type: AudienceChartType;
  series: AudienceChartSeries[];
};

type StateTileDefinition = {
  code: string;
  name: string;
  col: number;
  row: number;
};

type RegionStateTile = {
  code: string;
  name: string;
  col: number;
  row: number;
  value: number;
  valueLabel: string;
  intensity: number;
  isActive: boolean;
};

type RegionStateMapConfig = {
  title: string;
  states: RegionStateTile[];
  activeStates: RegionStateTile[];
};

type HeatmapCell = {
  key: string;
  dayLabel: string;
  dayOfWeek: number;
  hourOfDay: number;
  metricAverage: number;
  metricTotal: number;
  results: number;
  clicks: number;
  linkClicks: number;
  spend: number;
  ctr: number;
  impressions: number;
  intensity: number;
};

type HeatmapRow = {
  dayLabel: string;
  dayOfWeek: number;
  cells: HeatmapCell[];
};

type HourlyHeatmapConfig = {
  title: string;
  metricLabel: string;
  summarySlotLabel: string;
  summaryDayLabel: string;
  summaryHourLabel: string;
  rows: HeatmapRow[];
  hourLabels: string[];
};

const SURFACE_CHART_HEIGHT = 260;
const AUDIENCE_BREAKDOWN_CHART_HEIGHT = 180;
const HEATMAP_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const US_STATE_TILES: StateTileDefinition[] = [
  { code: 'WA', name: 'Washington', col: 1, row: 1 },
  { code: 'OR', name: 'Oregon', col: 1, row: 2 },
  { code: 'CA', name: 'California', col: 1, row: 3 },
  { code: 'AK', name: 'Alaska', col: 1, row: 6 },
  { code: 'HI', name: 'Hawaii', col: 2, row: 7 },
  { code: 'ID', name: 'Idaho', col: 2, row: 2 },
  { code: 'NV', name: 'Nevada', col: 2, row: 3 },
  { code: 'AZ', name: 'Arizona', col: 2, row: 4 },
  { code: 'MT', name: 'Montana', col: 3, row: 1 },
  { code: 'WY', name: 'Wyoming', col: 3, row: 2 },
  { code: 'UT', name: 'Utah', col: 3, row: 3 },
  { code: 'NM', name: 'New Mexico', col: 3, row: 4 },
  { code: 'ND', name: 'North Dakota', col: 4, row: 1 },
  { code: 'SD', name: 'South Dakota', col: 4, row: 2 },
  { code: 'CO', name: 'Colorado', col: 4, row: 3 },
  { code: 'MN', name: 'Minnesota', col: 5, row: 1 },
  { code: 'NE', name: 'Nebraska', col: 5, row: 2 },
  { code: 'KS', name: 'Kansas', col: 5, row: 3 },
  { code: 'OK', name: 'Oklahoma', col: 5, row: 4 },
  { code: 'TX', name: 'Texas', col: 5, row: 5 },
  { code: 'LA', name: 'Louisiana', col: 6, row: 5 },
  { code: 'WI', name: 'Wisconsin', col: 6, row: 1 },
  { code: 'IA', name: 'Iowa', col: 6, row: 2 },
  { code: 'MO', name: 'Missouri', col: 6, row: 3 },
  { code: 'AR', name: 'Arkansas', col: 6, row: 4 },
  { code: 'MS', name: 'Mississippi', col: 7, row: 5 },
  { code: 'MI', name: 'Michigan', col: 7, row: 1 },
  { code: 'IL', name: 'Illinois', col: 7, row: 2 },
  { code: 'KY', name: 'Kentucky', col: 7, row: 3 },
  { code: 'TN', name: 'Tennessee', col: 7, row: 4 },
  { code: 'AL', name: 'Alabama', col: 8, row: 5 },
  { code: 'IN', name: 'Indiana', col: 8, row: 2 },
  { code: 'OH', name: 'Ohio', col: 9, row: 2 },
  { code: 'WV', name: 'West Virginia', col: 8, row: 3 },
  { code: 'GA', name: 'Georgia', col: 9, row: 5 },
  { code: 'FL', name: 'Florida', col: 10, row: 6 },
  { code: 'PA', name: 'Pennsylvania', col: 10, row: 2 },
  { code: 'VA', name: 'Virginia', col: 9, row: 3 },
  { code: 'NC', name: 'North Carolina', col: 9, row: 4 },
  { code: 'SC', name: 'South Carolina', col: 10, row: 5 },
  { code: 'NY', name: 'New York', col: 10, row: 1 },
  { code: 'NJ', name: 'New Jersey', col: 11, row: 2 },
  { code: 'MD', name: 'Maryland', col: 10, row: 3 },
  { code: 'DE', name: 'Delaware', col: 11, row: 3 },
  { code: 'VT', name: 'Vermont', col: 11, row: 1 },
  { code: 'NH', name: 'New Hampshire', col: 12, row: 1 },
  { code: 'MA', name: 'Massachusetts', col: 12, row: 2 },
  { code: 'CT', name: 'Connecticut', col: 12, row: 3 },
  { code: 'RI', name: 'Rhode Island', col: 13, row: 2 },
  { code: 'ME', name: 'Maine', col: 13, row: 1 },
  { code: 'DC', name: 'District of Columbia', col: 10, row: 4 },
];

const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  'district of columbia': 'DC',
};

function resolveScope(params: URLSearchParams) {
  if (params.get('ad_id')) {
    return 'ad';
  }

  if (params.get('adset_id')) {
    return 'adset';
  }

  if (params.get('campaign_id')) {
    return 'campaign';
  }

  if (params.get('ad_account_id')) {
    return 'ad_account';
  }

  if (params.get('platform_integration_id')) {
    return 'platform';
  }

  return 'business';
}

function formatCurrency(value: number, currencyCode: string | null, digits = 0) {
  if (!currencyCode || currencyCode === 'MIXED') {
    return digits === 0 ? Math.round(value).toLocaleString() : value.toFixed(digits);
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    return `$${value.toFixed(digits)}`;
  }
}

function formatSignedPercent(value: number | null) {
  if (value == null) {
    return 'No comparison';
  }

  const rounded = Math.abs(value).toFixed(1);
  return value >= 0 ? `+${rounded}%` : `-${rounded}%`;
}

function formatCompactCurrency(value: number, currencyCode: string | null) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode || 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatRate(value: number) {
  return `${(Number.isFinite(value) ? value : 0).toFixed(2)}%`;
}

function formatDecimal(value: number) {
  return (Number.isFinite(value) ? value : 0).toFixed(2);
}

function formatHourShortLabel(hour: number) {
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
    return '';
  }

  const suffix = hour >= 12 ? 'P' : 'A';
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}${suffix}`;
}

function formatHourLongLabel(hour: number) {
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
    return 'Unknown';
  }

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}${suffix}`;
}

function shouldRenderHeatmapHourLabel(hour: number) {
  return hour === 0 || hour === 4 || hour === 8 || hour === 12 || hour === 16 || hour === 20;
}

function formatPerformanceChartValue(value: number) {
  return value.toLocaleString();
}

function formatEfficiencyChartValue(value: number) {
  return Number(value).toFixed(2);
}

function formatTooltipPayloadValue(
  value: ReportTooltipPayloadItem['value'],
  valueFormatter: (value: number) => string
) {
  if (Array.isArray(value)) {
    return value.join(' - ');
  }

  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN;

  if (Number.isFinite(numericValue)) {
    return valueFormatter(numericValue);
  }

  return value == null ? '0' : String(value);
}

function formatEntityPerformance(row: ReportBreakdownRow, currencyCode: string | null) {
  if (row.conversion > 0) {
    return `${row.conversion.toLocaleString()} results at ${formatCurrency(row.costPerResult, currencyCode, 2)} per result`;
  }

  return `${formatCurrency(row.spend, currencyCode, 2)} spent without a recorded result`;
}

function getEntityLabel(level: ReportBreakdownRow['level']) {
  if (level === 'campaign') {
    return 'Campaign';
  }

  if (level === 'adset') {
    return 'Ad set';
  }

  return 'Ad';
}

function getEntityPluralLabel(level: ReportBreakdownRow['level']) {
  if (level === 'campaign') {
    return 'Campaigns';
  }

  if (level === 'adset') {
    return 'Ad sets';
  }

  return 'Ads';
}

function scoreStrongestRow(row: ReportBreakdownRow) {
  const resultEfficiency = row.conversion > 0 ? row.conversion / Math.max(row.spend, 1) : 0;
  return row.conversion * 1000 + resultEfficiency * 10000 + row.ctr * 100 - row.cpc * 10;
}

function scoreWeakestRow(row: ReportBreakdownRow) {
  const resultPenalty = row.conversion === 0 ? 1000 : 0;
  return (
    resultPenalty +
    row.costPerResult * 12 +
    row.cpc * 6 +
    row.spend / 10 -
    row.ctr * 40 -
    row.conversion * 30
  );
}

function scoreRankedRow(row: ReportBreakdownRow) {
  return scoreStrongestRow(row);
}

function dedupeRows(rows: ReportBreakdownRow[]) {
  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

function rankBreakdownRows(rows: ReportBreakdownRow[]) {
  return dedupeRows(rows)
    .filter(
      (row) =>
        row.spend > 0 ||
        row.conversion > 0 ||
        row.clicks > 0 ||
        row.impressions > 0 ||
        row.reach > 0
    )
    .sort((left, right) => scoreRankedRow(right) - scoreRankedRow(left));
}

function pickStrongestRow(rows: ReportBreakdownRow[]) {
  return [...rows]
    .filter((row) => row.spend > 0 || row.conversion > 0 || row.clicks > 0)
    .sort((left, right) => scoreStrongestRow(right) - scoreStrongestRow(left))[0] ?? null;
}

function pickWeakestRow(rows: ReportBreakdownRow[]) {
  return [...rows]
    .filter((row) => row.spend > 0 || row.clicks > 0)
    .sort((left, right) => scoreWeakestRow(right) - scoreWeakestRow(left))[0] ?? null;
}

function pickMaxPoint(series: ReportTimeSeriesPoint[], key: keyof ReportTimeSeriesPoint) {
  return [...series].sort((left, right) => Number(right[key]) - Number(left[key]))[0] ?? null;
}

function resolveBreakdownMetric(
  slices: Array<DashboardPlatformSlice | DashboardAudienceSlice>
): BreakdownMetric {
  if (slices.some((slice) => slice.results > 0)) {
    return 'results';
  }

  if (slices.some((slice) => slice.clicks > 0)) {
    return 'clicks';
  }

  return 'spend';
}

function readBreakdownMetricValue(
  slice: DashboardPlatformSlice | DashboardAudienceSlice,
  metric: BreakdownMetric
) {
  if (metric === 'results') {
    return slice.results;
  }

  if (metric === 'clicks') {
    return slice.clicks;
  }

  return slice.spend;
}

function ageBucketSortValue(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 999;
}

function buildAgeGenderAudienceChart(input: {
  ageGender: DashboardAudienceSlice[];
  currencyCode: string | null;
}): AudienceChartConfig {
  const metric = resolveBreakdownMetric(input.ageGender);
  const ageBuckets = new Map<
    string,
    {
      segment: string;
      Female: number;
      Male: number;
      Unknown: number;
    }
  >();

  for (const slice of input.ageGender) {
    const parts = slice.label.split(/\s+/);
    const age = parts.at(-1) ?? 'Unknown';
    const rawGender = parts.slice(0, -1).join(' ').toLowerCase();
    const gender = rawGender.includes('female')
      ? 'Female'
      : rawGender.includes('male')
        ? 'Male'
        : 'Unknown';
    const current = ageBuckets.get(age) ?? {
      segment: age,
      Female: 0,
      Male: 0,
      Unknown: 0,
    };

    current[gender] += readBreakdownMetricValue(slice, metric);
    ageBuckets.set(age, current);
  }

  const data = Array.from(ageBuckets.values()).sort(
    (left, right) =>
      ageBucketSortValue(left.segment) - ageBucketSortValue(right.segment) ||
      left.segment.localeCompare(right.segment)
  );
  const series: AudienceChartSeries[] = [
    { name: 'Female', color: 'pink.5' },
    { name: 'Male', color: 'orange.6' },
  ];

  if (data.some((row) => row.Unknown > 0)) {
    series.push({ name: 'Unknown', color: 'gray.5' });
  }

  return {
    data,
    title: 'Audience response by age and gender',
    type: 'stacked',
    series,
    formatter: (value: number) =>
      metric === 'spend' ? formatCompactCurrency(value, input.currencyCode) : formatNumber(value),
  };
}

function buildAudienceChart(input: {
  ageGender: DashboardAudienceSlice[];
  geo: DashboardAudienceSlice[];
  currencyCode: string | null;
}): AudienceChartConfig {
  if (input.ageGender.length > 0) {
    return buildAgeGenderAudienceChart({
      ageGender: input.ageGender,
      currencyCode: input.currencyCode,
    });
  }

  const metric = resolveBreakdownMetric(input.geo);

  return {
    data: input.geo.slice(0, 6).map((item) => ({
      segment: item.secondaryLabel ? `${item.label} · ${item.secondaryLabel}` : item.label,
      Value: readBreakdownMetricValue(item, metric),
    })),
    title: 'Audience response by geo',
    type: 'default',
    series: [{ name: 'Value', color: 'teal.6' }],
    formatter: (value: number) =>
      metric === 'spend' ? formatCompactCurrency(value, input.currencyCode) : formatNumber(value),
  };
}

function platformSeriesColor(label: string) {
  const normalized = label.trim().toLowerCase();

  switch (normalized) {
    case 'facebook':
      return 'orange.6';
    case 'instagram':
      return 'red.6';
    case 'messenger':
      return 'violet.6';
    case 'audience network':
      return 'orange.6';
    default:
      return 'gray.6';
  }
}

function buildPlatformPanelChart(input: {
  platforms: DashboardPlatformSlice[];
  currencyCode: string | null;
}): MultiSeriesBarChartConfig {
  const slices = input.platforms.slice(0, 4);
  const metric = resolveBreakdownMetric(slices);
  const series = slices.map((slice) => ({
    name: slice.label,
    color: platformSeriesColor(slice.label),
  }));

  return {
    data: slices.map((slice) => {
      const row: Record<string, string | number> = {
        segment: slice.label,
      };

      for (const seriesItem of series) {
        row[seriesItem.name] = 0;
      }

      row[slice.label] = readBreakdownMetricValue(slice, metric);
      return row;
    }),
    title: 'Publisher platform response',
    series,
    withLegend: series.length > 1,
    formatter: (value: number) =>
      metric === 'spend' ? formatCompactCurrency(value, input.currencyCode) : formatNumber(value),
  };
}

function buildDevicePanelChart(input: {
  devices: DashboardPlatformSlice[];
  currencyCode: string | null;
}): MultiSeriesBarChartConfig {
  const slices = input.devices.slice(0, 6);
  const metric = resolveBreakdownMetric(slices);

  return {
    data: slices.map((slice) => ({
      segment: slice.label,
      Value: readBreakdownMetricValue(slice, metric),
    })),
    title: 'Impression device response',
    series: [{ name: 'Value', color: 'cyan.6' }],
    withLegend: false,
    formatter: (value: number) =>
      metric === 'spend' ? formatCompactCurrency(value, input.currencyCode) : formatNumber(value),
  };
}

function normalizeStateCode(label: string) {
  const normalized = label.trim().toLowerCase().replace(/\./g, '');

  if (!normalized) {
    return null;
  }

  if (normalized.length === 2) {
    return normalized.toUpperCase();
  }

  return STATE_NAME_TO_CODE[normalized] ?? null;
}

function buildRegionStateMap(input: {
  geo: DashboardAudienceSlice[];
  currencyCode: string | null;
}): RegionStateMapConfig {
  const regionSlices = input.geo.filter(
    (slice) => slice.secondaryLabel?.trim().toLowerCase() === 'region'
  );
  const metric = resolveBreakdownMetric(regionSlices);
  const regionValues = new Map<string, { name: string; value: number }>();

  for (const slice of regionSlices) {
    const code = normalizeStateCode(slice.label);
    if (!code) {
      continue;
    }

    const current = regionValues.get(code) ?? {
      name: US_STATE_TILES.find((tile) => tile.code === code)?.name ?? slice.label,
      value: 0,
    };

    current.value += readBreakdownMetricValue(slice, metric);
    regionValues.set(code, current);
  }

  const maxValue = Math.max(...Array.from(regionValues.values()).map((entry) => entry.value), 0);
  const states = US_STATE_TILES.map((tile) => {
    const match = regionValues.get(tile.code);
    const value = match?.value ?? 0;
    const intensity = maxValue > 0 ? value / maxValue : 0;

    return {
      code: tile.code,
      name: tile.name,
      col: tile.col,
      row: tile.row,
      value,
      valueLabel:
        metric === 'spend' ? formatCompactCurrency(value, input.currencyCode) : formatNumber(value),
      intensity,
      isActive: Boolean(match) && value > 0,
    };
  });

  return {
    title: 'Regional response by state',
    states,
    activeStates: states
      .filter((state) => state.isActive)
      .sort((left, right) => right.value - left.value || left.name.localeCompare(right.name))
      .slice(0, 6),
  };
}

function buildHourlyHeatmap(points: DashboardTrendPoint[]): HourlyHeatmapConfig | null {
  const hourlyPoints = points
    .filter(
      (point) =>
        point.dayKey &&
        point.dayOfWeek != null &&
        point.dayOfWeek >= 0 &&
        point.dayOfWeek <= 6 &&
        point.hourOfDay != null &&
        point.hourOfDay >= 0 &&
        point.hourOfDay <= 23
    )
    .map((point) => ({
      ...point,
      dayOfWeek: point.dayOfWeek as number,
      hourOfDay: point.hourOfDay as number,
    }));

  if (hourlyPoints.length === 0) {
    return null;
  }

  const prefersResults = hourlyPoints.some((point) => point.results > 0);
  const prefersLinkClicks =
    !prefersResults && hourlyPoints.some((point) => point.inlineLinkClicks > 0);
  const metricLabel = prefersResults ? 'Results' : prefersLinkClicks ? 'Link clicks' : 'Clicks';
  const aggregates = new Map<
    string,
    {
      dayOfWeek: number;
      hourOfDay: number;
      impressions: number;
      results: number;
      clicks: number;
      linkClicks: number;
      spend: number;
      occurrences: number;
    }
  >();

  for (const point of hourlyPoints) {
    const key = `${point.dayOfWeek}:${point.hourOfDay}`;
    const current = aggregates.get(key) ?? {
      dayOfWeek: point.dayOfWeek,
      hourOfDay: point.hourOfDay,
      impressions: 0,
      results: 0,
      clicks: 0,
      linkClicks: 0,
      spend: 0,
      occurrences: 0,
    };

    current.impressions += point.impressions;
    current.results += point.results;
    current.clicks += point.clicks;
    current.linkClicks += point.inlineLinkClicks;
    current.spend += point.spend;
    current.occurrences += 1;
    aggregates.set(key, current);
  }

  const cells = Array.from(aggregates.values()).map((aggregate) => {
    const metricTotal = prefersResults
      ? aggregate.results
      : prefersLinkClicks
        ? aggregate.linkClicks
        : aggregate.clicks;
    const metricAverage = aggregate.occurrences > 0 ? metricTotal / aggregate.occurrences : 0;
    const ctr = aggregate.impressions > 0 ? (aggregate.clicks / aggregate.impressions) * 100 : 0;

    return {
      key: `${aggregate.dayOfWeek}:${aggregate.hourOfDay}`,
      dayLabel: HEATMAP_DAY_LABELS[aggregate.dayOfWeek] ?? '-',
      dayOfWeek: aggregate.dayOfWeek,
      hourOfDay: aggregate.hourOfDay,
      metricAverage,
      metricTotal,
      results: aggregate.results,
      clicks: aggregate.clicks,
      linkClicks: aggregate.linkClicks,
      spend: aggregate.spend,
      ctr,
      impressions: aggregate.impressions,
      intensity: 0,
    } satisfies HeatmapCell;
  });

  const maxAverage = cells.reduce((max, cell) => Math.max(max, cell.metricAverage), 0);
  const normalizedCells = cells.map((cell) => ({
    ...cell,
    intensity: maxAverage > 0 ? Math.min(1, Math.sqrt(cell.metricAverage / maxAverage)) : 0,
  }));
  const rows: HeatmapRow[] = HEATMAP_DAY_LABELS.map((label, dayOfWeek) => ({
    dayLabel: label,
    dayOfWeek,
    cells: Array.from({ length: 24 }, (_, hourOfDay) => {
      const cell = normalizedCells.find(
        (candidate) => candidate.dayOfWeek === dayOfWeek && candidate.hourOfDay === hourOfDay
      );

      return (
        cell ?? {
          key: `${dayOfWeek}:${hourOfDay}`,
          dayLabel: label,
          dayOfWeek,
          hourOfDay,
          metricAverage: 0,
          metricTotal: 0,
          results: 0,
          clicks: 0,
          linkClicks: 0,
          spend: 0,
          ctr: 0,
          impressions: 0,
          intensity: 0,
        }
      );
    }),
  }));
  const bestCell = normalizedCells.sort(
    (left, right) =>
      right.metricAverage - left.metricAverage ||
      right.ctr - left.ctr ||
      right.spend - left.spend
  )[0];

  if (!bestCell) {
    return null;
  }

  const bestDay = rows
    .map((row) => ({
      dayLabel: row.dayLabel,
      metricAverage: row.cells.reduce((sum, cell) => sum + cell.metricAverage, 0),
    }))
    .sort((left, right) => right.metricAverage - left.metricAverage)[0];
  const bestHour = Array.from({ length: 24 }, (_, hourOfDay) => ({
    hourOfDay,
    metricAverage: rows.reduce((sum, row) => sum + row.cells[hourOfDay].metricAverage, 0),
  })).sort((left, right) => right.metricAverage - left.metricAverage)[0];

  return {
    title: `Best recurring ${metricLabel.toLowerCase()} times`,
    metricLabel,
    summarySlotLabel: `${bestCell.dayLabel} · ${formatHourLongLabel(bestCell.hourOfDay)}`,
    summaryDayLabel: bestDay?.dayLabel ?? '-',
    summaryHourLabel: bestHour ? formatHourLongLabel(bestHour.hourOfDay) : '-',
    rows,
    hourLabels: Array.from({ length: 24 }, (_, hourOfDay) =>
      shouldRenderHeatmapHourLabel(hourOfDay) ? formatHourShortLabel(hourOfDay) : ''
    ),
  };
}

function renderFilteredBarTooltip(input: {
  label?: string | number;
  payload?: Array<{ name?: string; value?: number | string | null; color?: string }>;
  series: AudienceChartSeries[];
  formatter: (value: number) => string;
}) {
  const filteredPayload = (input.payload ?? []).filter((item) => Number(item.value ?? 0) > 0);

  if (filteredPayload.length === 0) {
    return null;
  }

  return (
    <ChartTooltip
      label={input.label}
      payload={filteredPayload}
      series={input.series}
      valueFormatter={input.formatter}
    />
  );
}

function getActiveFilterCount(payload: ReportPayload) {
  let count = 0;

  if (payload.query.platformIntegrationId) {
    count += 1;
  }

  if (payload.query.adAccountIds.length > 0) {
    count += 1;
  }

  if (payload.query.campaignIds.length > 0) {
    count += 1;
  }

  if (payload.query.adsetIds.length > 0) {
    count += 1;
  }

  if (payload.query.adIds.length > 0) {
    count += 1;
  }

  return count;
}

type ReportBreadcrumbItem = {
  label: string;
  href: string | null;
};

function findFilterLabel(
  options: Array<{ id: string; label: string }>,
  id: string | null | undefined,
  fallback: string
) {
  if (!id) {
    return fallback;
  }

  return options.find((option) => option.id === id)?.label ?? fallback;
}

function buildReportBreadcrumbs(
  payload: ReportPayload,
  filterOptions: ReportFilterOptions
): ReportBreadcrumbItem[] {
  const items: ReportBreadcrumbItem[] = [];
  const { query } = payload;

  if (query.platformIntegrationId) {
    items.push({
      label: findFilterLabel(filterOptions.platforms, query.platformIntegrationId, 'Platform'),
      href:
        query.adAccountIds.length > 0 ||
        query.campaignIds.length > 0 ||
        query.adsetIds.length > 0 ||
        query.adIds.length > 0
          ? buildReportUrl({
              scope: 'platform',
              platformIntegrationId: query.platformIntegrationId,
              dateFrom: query.dateFrom,
              dateTo: query.dateTo,
              groupBy: query.groupBy,
              compareMode: query.compareMode,
              rangeMode: query.rangeMode,
            })
          : null,
    });
  }

  if (query.adAccountIds.length === 1) {
    items.push({
      label: findFilterLabel(filterOptions.adAccounts, query.adAccountIds[0], 'Ad account'),
      href:
        query.campaignIds.length > 0 || query.adsetIds.length > 0 || query.adIds.length > 0
          ? buildReportUrl({
              scope: 'ad_account',
              platformIntegrationId: query.platformIntegrationId,
              adAccountIds: [query.adAccountIds[0]],
              dateFrom: query.dateFrom,
              dateTo: query.dateTo,
              groupBy: query.groupBy,
              compareMode: query.compareMode,
              rangeMode: query.rangeMode,
            })
          : null,
    });
  }

  if (query.campaignIds.length === 1) {
    items.push({
      label: findFilterLabel(filterOptions.campaigns, query.campaignIds[0], 'Campaign'),
      href:
        query.adsetIds.length > 0 || query.adIds.length > 0
          ? buildReportUrl({
              scope: 'campaign',
              platformIntegrationId: query.platformIntegrationId,
              adAccountIds: query.adAccountIds,
              campaignIds: [query.campaignIds[0]],
              dateFrom: query.dateFrom,
              dateTo: query.dateTo,
              groupBy: query.groupBy,
              compareMode: query.compareMode,
              rangeMode: query.rangeMode,
            })
          : null,
    });
  }

  if (query.adsetIds.length === 1) {
    items.push({
      label: findFilterLabel(filterOptions.adsets, query.adsetIds[0], 'Ad set'),
      href:
        query.adIds.length > 0
          ? buildReportUrl({
              scope: 'adset',
              platformIntegrationId: query.platformIntegrationId,
              adAccountIds: query.adAccountIds,
              campaignIds: query.campaignIds,
              adsetIds: [query.adsetIds[0]],
              dateFrom: query.dateFrom,
              dateTo: query.dateTo,
              groupBy: query.groupBy,
              compareMode: query.compareMode,
              rangeMode: query.rangeMode,
            })
          : null,
    });
  }

  if (query.adIds.length === 1) {
    items.push({
      label: findFilterLabel(filterOptions.ads, query.adIds[0], 'Ad'),
      href: null,
    });
  }

  return items;
}

function KpiCard({ kpi }: { kpi: ReportKpi }) {
  const deltaClass =
    kpi.deltaPercent == null
      ? classes.deltaNeutral
      : kpi.deltaPercent >= 0
        ? classes.deltaPositive
        : classes.deltaNegative;
  const DeltaIcon =
    kpi.deltaPercent == null ? IconTimeline : kpi.deltaPercent >= 0 ? IconArrowUpRight : IconArrowDownRight;

  return (
    <Paper withBorder radius="xl" p="md" className={classes.kpiCard}>
      <Stack gap="xs">
        <Text size="xs" c="dimmed" tt="uppercase" fw={800}>
          {kpi.label}
        </Text>
        <Text fw={900} size="1.75rem" className={classes.kpiValue}>
          {kpi.formattedValue}
        </Text>
        <span className={`${classes.deltaPill} ${deltaClass}`}>
          <DeltaIcon size={13} />
          {formatSignedPercent(kpi.deltaPercent)}
        </span>
      </Stack>
    </Paper>
  );
}

type ReportAnalyticsMode =
  | 'ranking'
  | 'efficiency'
  | 'funnel'
  | 'activity'
  | 'cost'
  | 'waste'
  | 'placement';

const REPORT_ANALYTICS_OPTIONS: Array<{
  value: ReportAnalyticsMode;
  label: string;
  eyebrow: string;
  description: string;
}> = [
  {
    value: 'ranking',
    label: 'Campaign Ranking Table With Bars',
    eyebrow: 'Ranking',
    description: 'Ranked entities with spend, results, and cost/result bars.',
  },
  {
    value: 'efficiency',
    label: 'Spend vs Results Efficiency Chart',
    eyebrow: 'Efficiency',
    description: 'Spend bars paired with results and cost/result by period.',
  },
  {
    value: 'funnel',
    label: 'Funnel Summary',
    eyebrow: 'Funnel',
    description: 'Impressions to clicks to lead/result conversion shape.',
  },
  {
    value: 'activity',
    label: 'Delivery Activity Status',
    eyebrow: 'Activity',
    description: 'Active days, last delivery, and selected-range health.',
  },
  {
    value: 'cost',
    label: 'Cost Efficiency Distribution',
    eyebrow: 'Distribution',
    description: 'Campaigns grouped by efficient, watch, expensive, or no-result spend.',
  },
  {
    value: 'waste',
    label: 'Spend Waste Map',
    eyebrow: 'Waste map',
    description: 'Find scale, waste, opportunity, and low-signal entities.',
  },
  {
    value: 'placement',
    label: 'Placement Breakdown',
    eyebrow: 'Surface',
    description: 'Publisher/platform/device share from synced delivery breakdowns.',
  },
];

function getAnalyticsOption(mode: ReportAnalyticsMode) {
  return REPORT_ANALYTICS_OPTIONS.find((option) => option.value === mode) ?? REPORT_ANALYTICS_OPTIONS[0];
}

function getAnalyticsSelectData(mode: ReportAnalyticsMode, blockedMode: ReportAnalyticsMode) {
  return REPORT_ANALYTICS_OPTIONS.filter(
    (option) => option.value === mode || option.value !== blockedMode
  ).map((option) => ({
    value: option.value,
    label: option.label,
  }));
}

function hasReportActivity(row: Pick<ReportMetricTotals, 'spend' | 'conversion' | 'clicks' | 'impressions'>) {
  return row.spend > 0 || row.conversion > 0 || row.clicks > 0 || row.impressions > 0;
}

function getRankedAnalyticsRows(payload: ReportPayload) {
  const combinedRows = [
    ...payload.breakdown.rows,
    ...payload.ranking.topAdAccountCampaigns,
    ...payload.ranking.sameCampaignAdsets,
    ...payload.ranking.topAdAccountAdsets,
    ...payload.ranking.sameAdsetAds,
    ...payload.ranking.topAdAccountAds,
  ];

  return rankBreakdownRows(combinedRows);
}

function EmptyAnalyticsState({ title, description }: { title: string; description: string }) {
  return (
    <Stack align="center" justify="center" gap="xs" className={classes.analyticsEmptyState}>
      <Text fw={900}>{title}</Text>
      <Text size="sm" c="dimmed" ta="center" maw={360}>
        {description}
      </Text>
    </Stack>
  );
}

function truncateChartLabel(value: string, maxLength = 18) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function CampaignRankingBars({ payload }: { payload: ReportPayload }) {
  const rows = getRankedAnalyticsRows(payload).slice(0, 6);
  const maxSpend = Math.max(...rows.map((row) => row.spend), 1);

  if (rows.length === 0) {
    return (
      <EmptyAnalyticsState
        title="No ranked campaign rows"
        description="Synced campaign, ad set, or ad rows will appear here once the selected scope has delivery or structure data."
      />
    );
  }

  return (
    <Stack gap="sm" className={classes.analyticsRankingList}>
      {rows.map((row, index) => {
        const width = Math.max(8, Math.round((row.spend / maxSpend) * 100));
        const resultLabel =
          row.conversion > 0
            ? `${formatNumber(row.conversion)} results`
            : row.spend > 0
              ? 'No results'
              : 'No spend';

        return (
          <div key={`${row.level}:${row.id}`} className={classes.analyticsRankRow}>
            <Group justify="space-between" align="flex-start" gap="md" wrap="nowrap">
              <Group gap="sm" align="flex-start" wrap="nowrap" style={{ minWidth: 0 }}>
                <span className={classes.analyticsRankIndex}>{index + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <Text fw={900} lineClamp={1}>
                    {row.name}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    {getEntityLabel(row.level)} · {row.status ?? 'Unknown status'}
                  </Text>
                </div>
              </Group>
              <Stack gap={2} align="flex-end">
                <Text fw={900}>{formatCurrency(row.spend, payload.meta.currencyCode, 0)}</Text>
                <Text size="xs" c="dimmed">
                  {resultLabel}
                </Text>
              </Stack>
            </Group>
            <div className={classes.analyticsBarTrack} aria-hidden="true">
              <span className={classes.analyticsBarFill} style={{ width: `${width}%` }} />
            </div>
            <Group gap="xs" wrap="wrap">
              <Badge color="gray" variant="light" radius="sm">
                {formatCurrency(row.costPerResult, payload.meta.currencyCode, 2)} / result
              </Badge>
              <Badge color="gray" variant="light" radius="sm">
                {formatRate(row.ctr)} CTR
              </Badge>
              {row.drilldownHref ? (
                <Button component={Link} href={row.drilldownHref} size="compact-xs" radius="xl" variant="subtle">
                  Open
                </Button>
              ) : null}
            </Group>
          </div>
        );
      })}
    </Stack>
  );
}

function SpendResultsEfficiency({ payload }: { payload: ReportPayload }) {
  const rows = payload.series.filter(hasReportActivity).slice(-8);
  const maxSpend = Math.max(...rows.map((row) => row.spend), 1);
  const maxResults = Math.max(...rows.map((row) => row.conversion), 1);

  if (rows.length === 0) {
    return (
      <EmptyAnalyticsState
        title="No delivery in this range"
        description="Switch to Max or a wider date range to inspect the last active spend and result window."
      />
    );
  }

  return (
    <div className={classes.analyticsComboChart}>
      <div className={classes.analyticsComboLegend}>
        <span><i className={classes.analyticsLegendSpend} /> Spend bar</span>
        <span><i className={classes.analyticsLegendResults} /> Results marker</span>
        <span><i className={classes.analyticsLegendCost} /> Cost/result</span>
      </div>
      <div className={classes.analyticsComboPlot}>
        {rows.map((point) => {
          const spendHeight = Math.max(point.spend > 0 ? 8 : 0, Math.round((point.spend / maxSpend) * 76));
          const resultHeight =
            point.conversion > 0 ? Math.max(10, Math.round((point.conversion / maxResults) * 76)) : 0;
          const resultBottom = Math.min(84, Math.max(8, resultHeight + 8));

        return (
          <div
            key={point.key}
            className={classes.analyticsComboColumn}
            title={`${formatChartDateLabel(point.label)}: ${formatCurrency(point.spend, payload.meta.currencyCode, 0)} spend, ${formatNumber(point.conversion)} results`}
          >
            <span className={classes.analyticsComboCost}>
                {point.conversion > 0
                  ? formatCurrency(point.costPerResult, payload.meta.currencyCode, 0)
                  : 'No result'}
            </span>
            <div className={classes.analyticsComboCanvas}>
              <span
                className={classes.analyticsComboResultMarker}
                style={{ bottom: `${resultBottom}%` }}
              >
                {formatNumber(point.conversion)}
              </span>
              <span
                className={classes.analyticsComboBar}
                style={{ height: `${spendHeight}%` }}
              />
            </div>
            <div className={classes.analyticsComboFooter}>
              <strong>{formatChartDateLabel(point.label)}</strong>
              <span>{formatCurrency(point.spend, payload.meta.currencyCode, 0)}</span>
            </div>
              </div>
        );
      })}
      </div>
    </div>
  );
}

function FunnelSummaryGraph({ payload }: { payload: ReportPayload }) {
  const steps = [
    { label: 'Impressions', value: payload.summary.impressions },
    { label: 'Clicks', value: payload.summary.clicks },
    { label: 'Link clicks', value: payload.summary.linkClicks },
    { label: 'Results', value: payload.summary.conversion },
  ];
  const maxValue = Math.max(...steps.map((step) => step.value), 1);

  return (
    <div className={classes.analyticsFunnelChart}>
      {steps.map((step, index) => {
        const width = Math.max(step.value > 0 ? 10 : 0, Math.round((step.value / maxValue) * 100));
        const previous = index > 0 ? steps[index - 1]?.value ?? 0 : 0;
        const rate = previous > 0 ? (step.value / previous) * 100 : null;

        return (
          <div key={step.label} className={classes.analyticsFunnelStep}>
            <div className={classes.analyticsFunnelMeta}>
              <span>{step.label}</span>
              <strong>{formatNumber(step.value)}</strong>
            </div>
            <div className={classes.analyticsFunnelShape} style={{ width: `${width}%` }}>
              <span>{rate == null ? 'Entry' : `${formatRate(rate)} retained`}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DeliveryActivityStatus({ payload }: { payload: ReportPayload }) {
  const activeSeries = payload.series.filter(hasReportActivity);
  const lastActive = activeSeries[activeSeries.length - 1] ?? null;
  const activeBuckets = activeSeries.length;
  const totalBuckets = payload.series.length;
  const activeDays = payload.activeDates?.totalActiveDays ?? activeBuckets;
  const days = payload.activeDates?.days.slice(-42) ?? [];

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
        <div className={classes.analyticsStatTile}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={800}>
            Active buckets
          </Text>
          <Text fw={950} size="1.5rem">
            {activeBuckets}/{Math.max(totalBuckets, activeBuckets)}
          </Text>
        </div>
        <div className={classes.analyticsStatTile}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={800}>
            Active days
          </Text>
          <Text fw={950} size="1.5rem">
            {formatNumber(activeDays)}
          </Text>
        </div>
        <div className={classes.analyticsStatTile}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={800}>
            Last delivery
          </Text>
          <Text fw={950} size="1rem">
            {lastActive ? formatChartDateLabel(lastActive.label) : 'No delivery'}
          </Text>
        </div>
      </SimpleGrid>
      {days.length > 0 ? (
        <div className={classes.analyticsActivityBlock}>
          <div className={classes.analyticsActivityLegend}>
            <span><i /> Active delivery day</span>
            <span><i className={classes.analyticsActivityLegendIdle} /> No delivery</span>
          </div>
          <div className={classes.analyticsActivityGrid}>
            {days.map((day) => (
              <span
                key={day.date}
                title={`${day.date}: ${day.activeEntityCount} active ${payload.activeDates?.entityLabel ?? 'entities'}`}
                className={day.activeEntityCount > 0 ? classes.analyticsActivityDayActive : undefined}
              />
            ))}
          </div>
        </div>
      ) : (
        <Text size="sm" c="dimmed">
          No active-day calendar is available for this account-level view. The series summary above is based on the selected report buckets.
        </Text>
      )}
    </Stack>
  );
}

function CostEfficiencyDistribution({ payload }: { payload: ReportPayload }) {
  const rows = getRankedAnalyticsRows(payload).filter((row) => row.spend > 0);
  const buckets = [
    {
      label: 'Efficient',
      rows: rows.filter((row) => row.conversion > 0 && row.costPerResult <= payload.summary.costPerResult * 0.75),
    },
    {
      label: 'Watch',
      rows: rows.filter((row) => row.conversion > 0 && row.costPerResult > payload.summary.costPerResult * 0.75 && row.costPerResult <= payload.summary.costPerResult * 1.35),
    },
    {
      label: 'Expensive',
      rows: rows.filter((row) => row.conversion > 0 && row.costPerResult > payload.summary.costPerResult * 1.35),
    },
    {
      label: 'No result spend',
      rows: rows.filter((row) => row.conversion === 0),
    },
  ];
  const maxCount = Math.max(...buckets.map((bucket) => bucket.rows.length), 1);

  return (
    <Stack gap="sm">
      {buckets.map((bucket) => {
        const spend = bucket.rows.reduce((total, row) => total + row.spend, 0);
        const width = Math.max(bucket.rows.length > 0 ? 7 : 0, Math.round((bucket.rows.length / maxCount) * 100));

        return (
          <div key={bucket.label} className={classes.analyticsDistributionRow}>
            <Group justify="space-between" gap="md">
              <div>
                <Text fw={900}>{bucket.label}</Text>
                <Text size="xs" c="dimmed">
                  {bucket.rows.length} entities · {formatCurrency(spend, payload.meta.currencyCode, 0)} spend
                </Text>
              </div>
              <Text fw={900}>{bucket.rows.length}</Text>
            </Group>
            <div className={classes.analyticsBarTrack}>
              <span className={classes.analyticsBarFill} style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </Stack>
  );
}

function CostEfficiencyDonut({ payload }: { payload: ReportPayload }) {
  const rows = getRankedAnalyticsRows(payload).filter((row) => row.spend > 0);
  const baselineCost = payload.summary.costPerResult > 0 ? payload.summary.costPerResult : 1;
  const buckets = [
    {
      label: 'Efficient',
      rows: rows.filter((row) => row.conversion > 0 && row.costPerResult <= baselineCost * 0.75),
    },
    {
      label: 'Watch',
      rows: rows.filter(
        (row) =>
          row.conversion > 0 &&
          row.costPerResult > baselineCost * 0.75 &&
          row.costPerResult <= baselineCost * 1.35
      ),
    },
    {
      label: 'Expensive',
      rows: rows.filter((row) => row.conversion > 0 && row.costPerResult > baselineCost * 1.35),
    },
    {
      label: 'No result spend',
      rows: rows.filter((row) => row.conversion === 0),
    },
  ];
  const totalCount = Math.max(rows.length, 1);
  let cursor = 0;
  const colors = ['#0f766e', '#f59e0b', '#fd4b23', '#111827'];
  const gradientStops = buckets.map((bucket, index) => {
    const start = cursor;
    const size = (bucket.rows.length / totalCount) * 100;
    cursor += size;
    return `${colors[index]} ${start}% ${cursor}%`;
  });

  return (
    <div className={classes.analyticsDistributionChart}>
      <div
        className={classes.analyticsDistributionDonut}
        style={{
          background:
            rows.length > 0
              ? `conic-gradient(${gradientStops.join(', ')})`
              : 'rgba(148, 163, 184, 0.18)',
        }}
      >
        <span>
          <strong>{formatNumber(rows.length)}</strong>
          entities
        </span>
      </div>
      <div className={classes.analyticsDistributionLegend}>
        {buckets.map((bucket, index) => {
          const spend = bucket.rows.reduce((total, row) => total + row.spend, 0);

          return (
            <div key={bucket.label} className={classes.analyticsDistributionRow}>
              <span style={{ background: colors[index] }} />
              <div>
                <strong>{bucket.label}</strong>
                <small>
                  {bucket.rows.length} entities - {formatCurrency(spend, payload.meta.currencyCode, 0)} spend
                </small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpendWasteMap({ payload }: { payload: ReportPayload }) {
  const rows = getRankedAnalyticsRows(payload).filter((row) => row.spend > 0).slice(0, 16);
  const maxSpend = Math.max(...rows.map((row) => row.spend), 1);
  const maxResults = Math.max(...rows.map((row) => row.conversion), 1);

  if (rows.length === 0) {
    return (
      <EmptyAnalyticsState
        title="No spend to map"
        description="Waste mapping needs spend by campaign, ad set, or ad. Widen the range or sync delivery rows."
      />
    );
  }

  return (
    <div className={classes.analyticsWasteMap}>
      <span className={classes.analyticsWasteAxisX}>Results</span>
      <span className={classes.analyticsWasteAxisY}>Spend</span>
      <span className={classes.analyticsQuadrantTopLeft}>Review</span>
      <span className={classes.analyticsQuadrantTopRight}>Scale</span>
      <span className={classes.analyticsQuadrantBottomLeft}>Low signal</span>
      <span className={classes.analyticsQuadrantBottomRight}>Opportunity</span>
      {rows.map((row) => {
        const left = Math.min(94, Math.max(4, (row.conversion / maxResults) * 88 + 4));
        const bottom = Math.min(90, Math.max(6, (row.spend / maxSpend) * 84 + 6));
        const size = row.conversion === 0 ? 11 : 13;

        return (
          <span
            key={`${row.level}:${row.id}`}
            title={`${row.name}: ${formatCurrency(row.spend, payload.meta.currencyCode, 0)}, ${formatNumber(row.conversion)} results`}
            className={classes.analyticsWasteDot}
            style={{ left: `${left}%`, bottom: `${bottom}%`, width: size, height: size }}
          />
        );
      })}
    </div>
  );
}

function PlacementBreakdownGraph({ payload }: { payload: ReportPayload }) {
  const sourceRows =
    payload.surface.platformBreakdowns.publisherPlatforms.length > 0
      ? payload.surface.platformBreakdowns.publisherPlatforms
      : payload.surface.platformBreakdowns.impressionDevices;
  const rows = [...sourceRows].sort((left, right) => right.spend - left.spend).slice(0, 6);
  const maxSpend = Math.max(...rows.map((row) => row.spend), 1);

  if (rows.length === 0) {
    return (
      <EmptyAnalyticsState
        title="No placement rows"
        description="Meta placement, platform, or device breakdowns will appear after the selected account returns breakdown data."
      />
    );
  }

  return (
    <Stack gap="sm">
      {rows.map((row) => {
        const width = Math.max(5, Math.round((row.spend / maxSpend) * 100));

        return (
          <div key={`${row.kind}:${row.key}`} className={classes.analyticsPlacementRow}>
            <Group justify="space-between" gap="md" wrap="nowrap">
              <div style={{ minWidth: 0 }}>
                <Text fw={900} lineClamp={1}>
                  {row.label}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatNumber(row.results)} results · {formatRate(row.ctr)} CTR
                </Text>
              </div>
              <Text fw={900}>{formatCurrency(row.spend, payload.meta.currencyCode, 0)}</Text>
            </Group>
            <div className={classes.analyticsBarTrack}>
              <span className={classes.analyticsBarFill} style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </Stack>
  );
}

function SpendWasteMapExplained({ payload }: { payload: ReportPayload }) {
  const rows = getRankedAnalyticsRows(payload).filter((row) => row.spend > 0).slice(0, 16);
  const maxSpend = Math.max(...rows.map((row) => row.spend), 1);
  const maxResults = Math.max(...rows.map((row) => row.conversion), 1);

  if (rows.length === 0) {
    return (
      <EmptyAnalyticsState
        title="No spend to map"
        description="Waste mapping needs spend by campaign, ad set, or ad. Widen the range or sync delivery rows."
      />
    );
  }

  return (
    <Stack gap="sm">
      <div className={classes.analyticsWasteExplainer}>
        <span><strong>Y:</strong> higher spend</span>
        <span><strong>X:</strong> higher results</span>
        <span><strong>Top-left:</strong> review spend</span>
        <span><strong>Top-right:</strong> scale candidates</span>
      </div>
      <div className={classes.analyticsWasteMap}>
        <span className={classes.analyticsWasteAxisX}>More results -&gt;</span>
        <span className={classes.analyticsWasteAxisY}>More spend up</span>
        <span className={classes.analyticsQuadrantTopLeft}>Review</span>
        <span className={classes.analyticsQuadrantTopRight}>Scale</span>
        <span className={classes.analyticsQuadrantBottomLeft}>Low signal</span>
        <span className={classes.analyticsQuadrantBottomRight}>Opportunity</span>
        {rows.map((row, index) => {
          const left = Math.min(94, Math.max(4, (row.conversion / maxResults) * 88 + 4));
          const bottom = Math.min(90, Math.max(6, (row.spend / maxSpend) * 84 + 6));
          const size = row.conversion === 0 ? 11 : 13;

          return (
            <span
              key={`${row.level}:${row.id}`}
              title={`${row.name}: ${formatCurrency(row.spend, payload.meta.currencyCode, 0)}, ${formatNumber(row.conversion)} results`}
              className={classes.analyticsWastePoint}
              style={{ left: `${left}%`, bottom: `${bottom}%`, width: size, height: size }}
            >
              {index < 7 ? <em>{truncateChartLabel(row.name, 16)}</em> : null}
            </span>
          );
        })}
      </div>
    </Stack>
  );
}

function PlacementShareChart({ payload }: { payload: ReportPayload }) {
  const sourceRows =
    payload.surface.platformBreakdowns.publisherPlatforms.length > 0
      ? payload.surface.platformBreakdowns.publisherPlatforms
      : payload.surface.platformBreakdowns.impressionDevices;
  const rows = [...sourceRows].sort((left, right) => right.spend - left.spend).slice(0, 6);
  const totalSpend = rows.reduce((total, row) => total + row.spend, 0);
  const colors = ['#fd4b23', '#0f766e', '#f59e0b', '#2563eb', '#111827', '#94a3b8'];

  if (rows.length === 0) {
    return (
      <EmptyAnalyticsState
        title="No placement rows"
        description="Meta placement, platform, or device breakdowns will appear after the selected account returns breakdown data."
      />
    );
  }

  return (
    <div className={classes.analyticsPlacementChart}>
      <div className={classes.analyticsPlacementStackedBar}>
        {rows.map((row, index) => {
          const width = totalSpend > 0 ? Math.max(4, (row.spend / totalSpend) * 100) : 0;

          return (
            <span
              key={`${row.kind}:${row.key}:bar`}
              style={{ width: `${width}%`, background: colors[index] }}
              title={`${row.label}: ${formatCurrency(row.spend, payload.meta.currencyCode, 0)}`}
            />
          );
        })}
      </div>
      <div className={classes.analyticsPlacementLegend}>
        {rows.map((row, index) => {
          const share = totalSpend > 0 ? (row.spend / totalSpend) * 100 : 0;

          return (
            <div key={`${row.kind}:${row.key}`} className={classes.analyticsPlacementRow}>
              <span style={{ background: colors[index] }} />
              <div>
                <strong>{row.label}</strong>
                <small>
                  {formatRate(share)} spend share - {formatNumber(row.results)} results - {formatRate(row.ctr)} CTR
                </small>
              </div>
              <b>{formatCurrency(row.spend, payload.meta.currencyCode, 0)}</b>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportAnalyticsPanel({
  payload,
  mode,
  blockedMode,
  onModeChange,
}: {
  payload: ReportPayload;
  mode: ReportAnalyticsMode;
  blockedMode: ReportAnalyticsMode;
  onModeChange: (mode: ReportAnalyticsMode) => void;
}) {
  const option = getAnalyticsOption(mode);

  return (
    <Card withBorder radius="xl" p="lg" h="100%" className={`${classes.reportCard} ${classes.analyticsPanel}`}>
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="flex-start" gap="md" wrap="wrap" className={classes.analyticsPanelHeader}>
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={900}>
              {option.eyebrow}
            </Text>
            <Text fw={950} size="xl" mt={4} className={classes.analyticsPanelTitle}>
              {option.label}
            </Text>
            <Text size="sm" c="dimmed" mt={4}>
              {option.description}
            </Text>
          </div>
          <Select
            aria-label="Choose report graph"
            value={mode}
            onChange={(value) => {
              if (value) {
                onModeChange(value as ReportAnalyticsMode);
              }
            }}
            data={getAnalyticsSelectData(mode, blockedMode)}
            radius="xl"
            size="sm"
            className={classes.analyticsSelect}
            allowDeselect={false}
          />
        </Group>
        <div className={classes.analyticsPanelBody}>
          {mode === 'ranking' ? (
            <CampaignRankingBars payload={payload} />
          ) : mode === 'efficiency' ? (
            <SpendResultsEfficiency payload={payload} />
          ) : mode === 'funnel' ? (
            <FunnelSummaryGraph payload={payload} />
          ) : mode === 'activity' ? (
            <DeliveryActivityStatus payload={payload} />
          ) : mode === 'cost' ? (
            <CostEfficiencyDonut payload={payload} />
          ) : mode === 'waste' ? (
            <SpendWasteMapExplained payload={payload} />
          ) : (
            <PlacementShareChart payload={payload} />
          )}
        </div>
      </Stack>
    </Card>
  );
}

function getRankTone(index: number, total: number) {
  if (index === 0) {
    return { color: 'teal', label: 'Top performer' };
  }

  if (index <= Math.max(1, Math.floor(total * 0.25))) {
    return { color: 'orange', label: 'Leading' };
  }

  if (index >= Math.max(0, total - Math.max(1, Math.floor(total * 0.25)))) {
    return { color: 'orange', label: 'Needs review' };
  }

  return { color: 'gray', label: 'Mid-pack' };
}

type RankingSection = {
  title: string;
  rows: ReportBreakdownRow[];
};

type RankingGroup = {
  key: ReportBreakdownRow['level'];
  level: ReportBreakdownRow['level'];
  title: string;
  sections: RankingSection[];
  fullRows: ReportBreakdownRow[];
};

function getFullRankingTitle(level: ReportBreakdownRow['level']) {
  return `Full ${getEntityLabel(level).toLowerCase()} ranking`;
}

function getAccountRankingTitle(
  level: ReportBreakdownRow['level'],
  query: ReportPayload['query']
) {
  const accountLabel = query.adAccountIds.length === 1 ? 'this ad account' : 'selected accounts';
  return `Best ${getEntityPluralLabel(level).toLowerCase()} in ${accountLabel}`;
}

function getParentRankingTitle(
  level: ReportBreakdownRow['level'],
  query: ReportPayload['query']
) {
  if (level === 'adset') {
    const parentLabel = query.campaignIds.length > 1 ? 'these campaigns' : 'this campaign';
    return `Ad sets in ${parentLabel} ranking`;
  }

  if (level === 'ad') {
    const parentLabel = query.adsetIds.length > 1 ? 'these ad sets' : 'this ad set';
    return `Ads in ${parentLabel} ranking`;
  }

  return 'Campaign ranking';
}

function getRankingLevelOrder(level: ReportBreakdownRow['level']) {
  if (level === 'campaign') {
    return 0;
  }

  if (level === 'adset') {
    return 1;
  }

  return 2;
}

function shouldCollapseParentRankingGroup(
  groupLevel: ReportBreakdownRow['level'],
  currentLevel: ReportBreakdownRow['level'] | null
) {
  if (!currentLevel) {
    return false;
  }

  const currentLevelOrder = getRankingLevelOrder(currentLevel);
  if (currentLevelOrder === 0) {
    return false;
  }

  return getRankingLevelOrder(groupLevel) < currentLevelOrder;
}

function isNestedEntityScope(scope: ReportPayload['query']['scope']) {
  return scope === 'campaign' || scope === 'adset' || scope === 'ad';
}

function buildRankingGroup(input: {
  level: ReportBreakdownRow['level'];
  primaryTitle: string;
  primaryRows: ReportBreakdownRow[];
  comparisonTitle?: string;
  comparisonRows?: ReportBreakdownRow[];
}): RankingGroup | null {
  const primaryRows = input.primaryRows;
  const comparisonSourceRows = input.comparisonRows ?? [];
  const primaryIds = new Set(primaryRows.map((row) => row.id));
  const comparisonRows = comparisonSourceRows.filter((row) => !primaryIds.has(row.id));
  const sections: RankingSection[] = [];
  const fullRows = comparisonSourceRows.length > 0 ? comparisonSourceRows : primaryRows;

  if (primaryRows.length > 0) {
    sections.push({
      title: input.primaryTitle,
      rows: primaryRows,
    });
  }

  if (comparisonRows.length > 0 && input.comparisonTitle) {
    sections.push({
      title: input.comparisonTitle,
      rows: comparisonRows,
    });
  }

  if (sections.length === 0 || fullRows.length === 0) {
    return null;
  }

  return {
    key: input.level,
    level: input.level,
    title: `${getEntityLabel(input.level)} ranking`,
    sections,
    fullRows,
  };
}

function RankedEntityBoard({
  rows,
  currencyCode,
  ranking,
  query,
}: {
  rows: ReportBreakdownRow[];
  currencyCode: string | null;
  ranking: ReportPayload['ranking'];
  query: ReportPayload['query'];
}) {
  const [openedRankingKey, setOpenedRankingKey] = useState<ReportBreakdownRow['level'] | null>(null);
  const [openedCollapsedRankingKeys, setOpenedCollapsedRankingKeys] = useState<
    ReportBreakdownRow['level'][]
  >([]);
  const rankedRows = rankBreakdownRows(rows);
  const currentLevel = rankedRows[0]?.level ?? null;
  const campaignRows = rankBreakdownRows(
    currentLevel === 'campaign' ? rankedRows : ranking.topAdAccountCampaigns
  );
  const adsetPrimaryRows = rankBreakdownRows(
    currentLevel === 'adset' ? rankedRows : ranking.sameCampaignAdsets
  );
  const adsetComparisonRows = rankBreakdownRows(ranking.topAdAccountAdsets);
  const adPrimaryRows = rankBreakdownRows(
    currentLevel === 'ad' ? rankedRows : ranking.sameAdsetAds
  );
  const adComparisonRows = rankBreakdownRows(ranking.topAdAccountAds);
  const rankingGroups = [
    buildRankingGroup({
      level: 'campaign',
      primaryTitle: currentLevel === 'campaign' ? 'Ranked campaigns' : getAccountRankingTitle('campaign', query),
      primaryRows: campaignRows,
    }),
    buildRankingGroup({
      level: 'adset',
      primaryTitle: getParentRankingTitle('adset', query),
      primaryRows: adsetPrimaryRows,
      comparisonTitle: getAccountRankingTitle('adset', query),
      comparisonRows: adsetComparisonRows,
    }),
    buildRankingGroup({
      level: 'ad',
      primaryTitle: getParentRankingTitle('ad', query),
      primaryRows: adPrimaryRows,
      comparisonTitle: getAccountRankingTitle('ad', query),
      comparisonRows: adComparisonRows,
    }),
  ].filter((group): group is RankingGroup => Boolean(group));
  const activeRankingGroup =
    rankingGroups.find((group) => group.key === openedRankingKey) ?? null;
  const collapsedRankingGroups = rankingGroups.filter((group) =>
    shouldCollapseParentRankingGroup(group.level, currentLevel)
  );
  const visibleRankingGroups = rankingGroups.filter(
    (group) => !shouldCollapseParentRankingGroup(group.level, currentLevel)
  );
  const isTopLevelReport = !isNestedEntityScope(query.scope);
  const rankingGroupKeys = rankingGroups.map((group) => group.key).join('|');

  useEffect(() => {
    setOpenedCollapsedRankingKeys([]);
  }, [currentLevel, rankingGroupKeys]);

  const renderRankedRows = (inputRows: ReportBreakdownRow[]) =>
    inputRows.slice(0, 4).map((row, index) => {
      const tone = getRankTone(index, inputRows.length);

      return (
        <div key={`${row.level}:${row.id}`} className={classes.moverRow}>
          <Group justify="space-between" align="flex-start" gap="md" wrap="nowrap">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Group gap={8} wrap="wrap">
                <Badge color={tone.color} variant="light" radius="sm">
                  #{index + 1}
                </Badge>
                <Text fw={800} lineClamp={1}>
                  {row.name}
                </Text>
              </Group>
              <Text size="sm" c="dimmed" mt={6}>
                {formatEntityPerformance(row, currencyCode)}
              </Text>
              <Text size="xs" c="dimmed" mt={6} lineClamp={1}>
                {row.creativeContext
                  ? `Creative: ${row.creativeContext}`
                  : row.primaryContext || row.secondaryContext
                    ? [row.primaryContext, row.secondaryContext].filter(Boolean).join(' · ')
                    : 'No extra context yet'}
              </Text>
            </div>
            <Stack gap={6} align="flex-end">
              <Badge color={tone.color} variant="light" radius="sm">
                {tone.label}
              </Badge>
              <Badge color="gray" variant="light" radius="sm">
                {getEntityLabel(row.level)}
              </Badge>
              {row.drilldownHref ? (
                <Button
                  component={Link}
                  href={row.drilldownHref}
                  variant="subtle"
                  size="compact-xs"
                  radius="xl"
                >
                  {row.drilldownLabel ?? 'Open'}
                </Button>
              ) : null}
            </Stack>
          </Group>
          <Group gap="xs" mt="sm" wrap="wrap">
            <Badge variant="outline" color="gray" radius="sm">
              {row.conversion.toLocaleString()} results
            </Badge>
            <Badge variant="outline" color="gray" radius="sm">
              {formatCurrency(row.costPerResult, currencyCode, 2)} / result
            </Badge>
            <Badge variant="outline" color="gray" radius="sm">
              {row.ctr.toFixed(2)}% CTR
            </Badge>
            <Badge variant="outline" color="gray" radius="sm">
              {formatCurrency(row.spend, currencyCode, 2)} spend
            </Badge>
          </Group>
        </div>
      );
    });

  const renderRankingGroupContent = (group: RankingGroup) => (
    <Stack gap="sm">
      {group.sections.map((section) => (
        <Stack key={`${group.key}:${section.title}`} gap="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={800}>
            {section.title}
          </Text>
          {renderRankedRows(section.rows)}
        </Stack>
      ))}
      <Group justify="flex-end">
        <Button
          variant="light"
          radius="xl"
          size="xs"
          onClick={() => setOpenedRankingKey(group.key)}
        >
          Open {getFullRankingTitle(group.level).toLowerCase()}
        </Button>
      </Group>
    </Stack>
  );

  if (isTopLevelReport) {
    return (
      <Paper withBorder radius="xl" p="md" className={classes.reportCard}>
        <Group gap="sm" mb="md" className={classes.cardHeader}>
          <ThemeIcon variant="light" color="orange" radius="md">
            <IconTimeline size={18} />
          </ThemeIcon>
          <div>
            <Text fw={800}>Performance ranking</Text>
            <Text size="sm" c="dimmed">
              Full campaign, ad set, and ad rankings for the current report scope.
            </Text>
          </div>
        </Group>

        {rankingGroups.length > 0 ? (
          <Accordion
            multiple
            defaultValue={query.scope === 'ad_account' ? rankingGroups.map((group) => group.key) : undefined}
            radius="lg"
            variant="separated"
            className={classes.rankingAccordion}
          >
            {rankingGroups.map((group) => (
              <Accordion.Item
                key={group.key}
                value={group.key}
                className={classes.rankingAccordionItem}
              >
                <Accordion.Control className={classes.rankingAccordionControl}>
                  <Group justify="space-between" align="center" gap="sm" wrap="wrap">
                    <Text fw={800}>{getEntityPluralLabel(group.level)} ranking</Text>
                    <Group gap="xs" wrap="wrap">
                      <Badge color="gray" variant="outline" radius="sm">
                        Full ranking
                      </Badge>
                      <Badge color="gray" variant="light" radius="sm">
                        {group.fullRows.length.toLocaleString()} ranked
                      </Badge>
                    </Group>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <PerformanceTable
                    title={getFullRankingTitle(group.level)}
                    rows={group.fullRows}
                    currencyCode={currencyCode}
                    hideTitle
                    showRanking
                  />
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        ) : (
          <Text size="sm" c="dimmed">
            No entity ranking is available for the current filters.
          </Text>
        )}
      </Paper>
    );
  }

  return (
    <Paper withBorder radius="xl" p="md" className={classes.reportCard}>
      <Modal
        opened={Boolean(activeRankingGroup)}
        onClose={() => setOpenedRankingKey(null)}
        title={activeRankingGroup ? getFullRankingTitle(activeRankingGroup.level) : 'Full ranking'}
        size="90%"
        centered
      >
        {activeRankingGroup ? (
          <PerformanceTable
            title={getFullRankingTitle(activeRankingGroup.level)}
            rows={activeRankingGroup.fullRows}
            currencyCode={currencyCode}
            hideTitle
            showRanking
          />
        ) : null}
      </Modal>

      <Group gap="sm" mb="md" className={classes.cardHeader}>
        <ThemeIcon variant="light" color="orange" radius="md">
          <IconTimeline size={18} />
        </ThemeIcon>
        <div>
          <Text fw={800}>Performance ranking</Text>
          <Text size="sm" c="dimmed">
            Highest to lowest for campaigns, ad sets, and ads in the current filters.
          </Text>
        </div>
      </Group>
      <Stack gap="sm">
        {rankingGroups.length > 0 ? (
          <>
            {collapsedRankingGroups.length > 0 ? (
              <Accordion
                multiple
                radius="lg"
                variant="separated"
                value={openedCollapsedRankingKeys}
                onChange={(value) =>
                  setOpenedCollapsedRankingKeys(value as ReportBreakdownRow['level'][])
                }
                className={classes.rankingAccordion}
              >
                {collapsedRankingGroups.map((group) => (
                  <Accordion.Item
                    key={group.key}
                    value={group.key}
                    className={classes.rankingAccordionItem}
                  >
                    <Accordion.Control className={classes.rankingAccordionControl}>
                      <Group justify="space-between" align="center" gap="sm" wrap="wrap">
                        <Text fw={800}>{group.title}</Text>
                        <Group gap="xs" wrap="wrap">
                          <Badge color="gray" variant="outline" radius="sm">
                            Previous level
                          </Badge>
                          <Badge color="gray" variant="light" radius="sm">
                            {group.fullRows.length.toLocaleString()} ranked
                          </Badge>
                        </Group>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>{renderRankingGroupContent(group)}</Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            ) : null}

            {visibleRankingGroups.map((group) => (
              <Stack key={group.key} gap="sm">
                <Group justify="space-between" align="center" gap="sm" wrap="wrap">
                  <Text fw={800}>{group.title}</Text>
                  <Badge color="gray" variant="light" radius="sm">
                    {group.fullRows.length.toLocaleString()} ranked
                  </Badge>
                </Group>
                {renderRankingGroupContent(group)}
              </Stack>
            ))}
          </>
        ) : (
          <Text size="sm" c="dimmed">
            No entity breakdown is available for the current filters.
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

function ReportDeliverySurfaceGraph({ payload }: { payload: ReportPayload }) {
  const [surfacePanelMode, setSurfacePanelMode] = useState<SurfacePanelMode>('platform');
  const isMeta = payload.surface.isMeta;
  const platformBreakdowns = payload.surface.platformBreakdowns;
  const audienceBreakdowns = payload.surface.audienceBreakdowns;
  const hourlyHeatmap = useMemo(
    () => buildHourlyHeatmap(payload.surface.hourlyTrendExpanded),
    [payload.surface.hourlyTrendExpanded]
  );
  const platformPanelChart = useMemo(
    () =>
      buildPlatformPanelChart({
        platforms: platformBreakdowns.publisherPlatforms,
        currencyCode: payload.meta.currencyCode,
      }),
    [payload.meta.currencyCode, platformBreakdowns.publisherPlatforms]
  );
  const devicePanelChart = useMemo(
    () =>
      buildDevicePanelChart({
        devices: platformBreakdowns.impressionDevices,
        currencyCode: payload.meta.currencyCode,
      }),
    [payload.meta.currencyCode, platformBreakdowns.impressionDevices]
  );
  const regionStateMap = useMemo(
    () =>
      buildRegionStateMap({
        geo: audienceBreakdowns.geo,
        currencyCode: payload.meta.currencyCode,
      }),
    [audienceBreakdowns.geo, payload.meta.currencyCode]
  );
  const audienceChart = useMemo(
    () =>
      buildAudienceChart({
        ageGender: audienceBreakdowns.ageGender,
        geo: audienceBreakdowns.geo,
        currencyCode: payload.meta.currencyCode,
      }),
    [audienceBreakdowns.ageGender, audienceBreakdowns.geo, payload.meta.currencyCode]
  );
  const activeSurfaceChart =
    surfacePanelMode === 'platform' ? platformPanelChart : devicePanelChart;
  const activeSurfaceTooltipProps = useMemo(
    () => ({
      content: ({
        label,
        payload: tooltipPayload,
      }: {
        label?: string | number;
        payload?: Array<{ name?: string; value?: number | string | null; color?: string }>;
      }) =>
        renderFilteredBarTooltip({
          label,
          payload: tooltipPayload,
          series: activeSurfaceChart.series,
          formatter: activeSurfaceChart.formatter,
        }),
    }),
    [activeSurfaceChart.formatter, activeSurfaceChart.series]
  );
  const audienceChartTooltipProps = useMemo(
    () => ({
      content: ({
        label,
        payload: tooltipPayload,
      }: {
        label?: string | number;
        payload?: Array<{ name?: string; value?: number | string | null; color?: string }>;
      }) =>
        renderFilteredBarTooltip({
          label,
          payload: tooltipPayload,
          series: audienceChart.series,
          formatter: audienceChart.formatter,
        }),
    }),
    [audienceChart.formatter, audienceChart.series]
  );
  const activeSurfaceTitle =
    surfacePanelMode === 'platform'
      ? platformPanelChart.title
      : surfacePanelMode === 'device'
        ? devicePanelChart.title
        : surfacePanelMode === 'times'
          ? hourlyHeatmap?.title ?? 'Best recurring click times'
          : regionStateMap.title;

  return (
    <Card withBorder radius="xl" p="lg" h="100%" className={classes.reportCard}>
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="flex-start" gap="sm" wrap="wrap" className={classes.cardHeader}>
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon color="teal" variant="light" radius="md">
              <IconChartBar size={18} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={800}>
                Delivery surface graph
              </Text>
              <Text fw={900} size="xl" mt={4}>
                {activeSurfaceTitle}
              </Text>
              <Text size="sm" c="dimmed" mt={4}>
                Synced surface breakdowns for the selected scope and date range.
              </Text>
            </div>
          </Group>
        </Group>

        <Group gap="xs" wrap="wrap" className={classes.surfacePanelActions}>
          <Button
            size="xs"
            radius="xl"
            variant={surfacePanelMode === 'platform' ? 'filled' : 'light'}
            onClick={() => setSurfacePanelMode('platform')}
          >
            Platforms
          </Button>
          <Button
            size="xs"
            radius="xl"
            variant={surfacePanelMode === 'device' ? 'filled' : 'light'}
            onClick={() => setSurfacePanelMode('device')}
          >
            Devices
          </Button>
          <Button
            size="xs"
            radius="xl"
            variant={surfacePanelMode === 'geo' ? 'filled' : 'light'}
            onClick={() => setSurfacePanelMode('geo')}
          >
            Geo
          </Button>
          <Button
            size="xs"
            radius="xl"
            variant={surfacePanelMode === 'times' ? 'filled' : 'light'}
            onClick={() => setSurfacePanelMode('times')}
          >
            Times
          </Button>
        </Group>

        <Stack gap="md" className={classes.surfacePanelBody}>
          {surfacePanelMode === 'times' ? (
            hourlyHeatmap ? (
              <Stack gap="sm">
                <Group gap="xs" wrap="wrap">
                  <Badge color="orange" variant="light" radius="sm">
                    Best slot: {hourlyHeatmap.summarySlotLabel}
                  </Badge>
                  <Badge color="gray" variant="outline" radius="sm">
                    Best day: {hourlyHeatmap.summaryDayLabel}
                  </Badge>
                  <Badge color="gray" variant="outline" radius="sm">
                    Best hour: {hourlyHeatmap.summaryHourLabel}
                  </Badge>
                </Group>

                <ScrollArea
                  type="auto"
                  scrollbars="x"
                  offsetScrollbars="x"
                  className={classes.heatmapScrollArea}
                >
                  <div className={classes.heatmapGrid}>
                    <div className={classes.heatmapCorner} />
                    {hourlyHeatmap.hourLabels.map((label, index) => (
                      <Text
                        key={`report-heatmap-hour-${index}`}
                        size="10px"
                        c="dimmed"
                        ta="center"
                        className={classes.heatmapHourLabel}
                      >
                        {label}
                      </Text>
                    ))}

                    {hourlyHeatmap.rows.map((row) => (
                      <Fragment key={`report-heatmap-row-${row.dayOfWeek}`}>
                        <Text
                          size="10px"
                          fw={700}
                          c="dimmed"
                          className={classes.heatmapDayLabel}
                        >
                          {row.dayLabel}
                        </Text>
                        {row.cells.map((cell) => (
                          <div
                            key={cell.key}
                            className={classes.heatmapCell}
                            style={{
                              backgroundColor:
                                cell.metricAverage > 0
                          ? `rgba(253, 75, 35, ${0.12 + cell.intensity * 0.76})`
                                  : 'rgba(241, 245, 249, 0.94)',
                              borderColor:
                                cell.metricAverage > 0
                                  ? 'rgba(253, 75, 35, 0.28)'
                                  : 'rgba(226, 232, 240, 0.94)',
                            }}
                            title={`${cell.dayLabel} · ${formatHourLongLabel(
                              cell.hourOfDay
                            )}: avg ${formatDecimal(cell.metricAverage)} ${
                              hourlyHeatmap.metricLabel
                            }/slot · total ${formatNumber(cell.metricTotal)} · CTR ${formatRate(
                              cell.ctr
                            )} · Spend ${formatCurrency(cell.spend, payload.meta.currencyCode, 2)}`}
                          />
                        ))}
                      </Fragment>
                    ))}
                  </div>
                </ScrollArea>
              </Stack>
            ) : (
              <Paper withBorder radius="xl" p="md" className={classes.emptyPanel}>
                <Text fw={700}>
                  {isMeta ? 'Best times heatmap is still preparing' : 'Best times are Meta-only'}
                </Text>
                <Text size="sm" c="dimmed" mt={6}>
                  {isMeta
                    ? 'Hourly rows will appear here once the selected report scope has advertiser-time history.'
                    : 'The times heatmap is only wired for Meta right now.'}
                </Text>
              </Paper>
            )
          ) : surfacePanelMode === 'geo' ? (
            audienceBreakdowns.state === 'available' && regionStateMap.activeStates.length > 0 ? (
              <Stack gap="sm">
                <div className={classes.stateMapWrap}>
                  <div className={classes.stateMapGrid}>
                    {regionStateMap.states.map((state) => (
                      <div
                        key={state.code}
                        className={classes.stateMapTile}
                        style={{
                          gridColumn: `${state.col}`,
                          gridRow: `${state.row}`,
                          backgroundColor: state.isActive
                            ? `rgba(253, 75, 35, ${0.18 + state.intensity * 0.68})`
                            : 'rgba(241, 245, 249, 0.96)',
                          borderColor: state.isActive
                            ? 'rgba(253, 75, 35, 0.42)'
                            : 'rgba(203, 213, 225, 0.9)',
                          color:
                            state.isActive && state.intensity > 0.45
                              ? '#ffffff'
                              : state.isActive
                                ? '#9a3412'
                                : '#64748b',
                        }}
                        title={state.isActive ? `${state.name}: ${state.valueLabel}` : state.name}
                      >
                        {state.code}
                      </div>
                    ))}
                  </div>
                </div>

                <Group gap="xs" wrap="wrap">
                  {regionStateMap.activeStates.map((state) => (
                    <Badge key={state.code} color="orange" variant="light" radius="sm">
                      {state.name}: {state.valueLabel}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            ) : (
              <Stack justify="center" align="center" h={SURFACE_CHART_HEIGHT} gap="xs">
                <Text fw={800}>
                  {isMeta ? 'Regional state rows are still syncing' : 'Regional state map is Meta-only'}
                </Text>
                <Text size="sm" c="dimmed" ta="center" maw={320}>
                  {isMeta
                    ? 'State-level regions will appear here once Meta region rows are available for this report scope.'
                    : 'The geo state map is only wired for Meta right now.'}
                </Text>
              </Stack>
            )
          ) : platformBreakdowns.state === 'available' && activeSurfaceChart.data.length > 0 ? (
            <BarChart
              h={SURFACE_CHART_HEIGHT}
              data={activeSurfaceChart.data}
              dataKey="segment"
              withLegend={activeSurfaceChart.withLegend}
              series={activeSurfaceChart.series}
              tooltipProps={activeSurfaceTooltipProps}
              valueFormatter={activeSurfaceChart.formatter}
              tickLine="y"
            />
          ) : (
            <Stack justify="center" align="center" h={SURFACE_CHART_HEIGHT} gap="xs">
              <Text fw={800}>
                {isMeta
                  ? surfacePanelMode === 'device'
                    ? 'Device rows are still syncing'
                    : 'Platform rows are still syncing'
                  : 'This graph is Meta-only'}
              </Text>
              <Text size="sm" c="dimmed" ta="center" maw={320}>
                {isMeta
                  ? surfacePanelMode === 'device'
                    ? 'Impression-device bars will appear here once Meta rows exist for this report scope.'
                    : 'Publisher platform bars will appear here once Meta rows exist for this report scope.'
                  : 'The delivery surface graph is only wired for Meta right now.'}
              </Text>
            </Stack>
          )}

          <div className={classes.chartSubSection}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={800} mb={6}>
              Audience breakdown
            </Text>
            <Text fw={700} mb="sm">
              {audienceChart.title}
            </Text>
            {audienceBreakdowns.state === 'available' && audienceChart.data.length > 0 ? (
              <BarChart
                h={AUDIENCE_BREAKDOWN_CHART_HEIGHT}
                type={audienceChart.type}
                data={audienceChart.data}
                dataKey="segment"
                withLegend={audienceChart.series.length > 1}
                series={audienceChart.series}
                tooltipProps={audienceChartTooltipProps}
                valueFormatter={audienceChart.formatter}
                tickLine="y"
              />
            ) : (
              <Paper withBorder radius="xl" p="md" className={classes.emptyPanel}>
                <Text fw={700}>
                  {isMeta ? 'Audience rows are still syncing' : 'Audience graph is Meta-only'}
                </Text>
                <Text size="sm" c="dimmed" mt={6}>
                  {isMeta
                    ? 'Age, gender, and geo breakdowns will appear here once Meta audience rows exist for this report scope.'
                    : 'The audience breakdown graph is only wired for Meta right now.'}
                </Text>
              </Paper>
            )}
          </div>
        </Stack>
      </Stack>
    </Card>
  );
}

function ReportChartTooltip({
  active,
  label,
  payload,
  series,
  annotations,
  valueFormatter,
}: ReportTooltipContentProps & {
  series: ReportChartSeries[];
  annotations: TimelineAnnotation[];
  valueFormatter: (value: number) => string;
}) {
  if (!active) {
    return null;
  }

  const labelText = label == null ? '' : String(label);
  const rows = Array.isArray(payload) ? payload : [];
  const matchingAnnotations = annotations.filter((annotation) => annotation.chartLabel === labelText);

  return (
    <Paper withBorder radius="md" p={8} className={classes.reportChartTooltip}>
      {labelText ? (
        <Text fw={850} size="xs" className={classes.reportChartTooltipTitle}>
          {labelText}
        </Text>
      ) : null}

      <Stack gap={4} mt={labelText ? 6 : 0}>
        {rows.map((item) => {
          const name = String(item.name ?? item.dataKey ?? '');
          const seriesConfig = series.find((entry) => entry.name === name);
          const color = item.color ?? item.stroke ?? item.fill ?? seriesConfig?.color ?? '#64748b';

          return (
            <Group key={name} justify="space-between" gap="md" wrap="nowrap" className={classes.reportChartTooltipRow}>
              <Group gap={6} wrap="nowrap">
                <span className={classes.reportChartTooltipDot} style={{ backgroundColor: color }} />
                <Text size="xs">{name}</Text>
              </Group>
              <Text size="xs" fw={800}>
                {formatTooltipPayloadValue(item.value, valueFormatter)}
              </Text>
            </Group>
          );
        })}
      </Stack>

      {matchingAnnotations.length > 0 ? (
        <Stack gap={5} mt={6} pt={6} className={classes.reportAnnotationTooltip}>
          {matchingAnnotations.map((annotation) => (
            <Group key={annotation.key} gap={6} wrap="nowrap" align="flex-start">
              <span className={classes.chartAnnotationDot} style={{ backgroundColor: annotation.color, marginTop: 4 }} />
              <div>
                <Text size="xs" fw={850}>
                  {annotation.label}
                </Text>
                <Text size="xs" c="dimmed" className={classes.reportAnnotationTooltipDetail}>
                  {annotation.detail}
                </Text>
              </div>
            </Group>
          ))}
        </Stack>
      ) : null}
    </Paper>
  );
}

function AnnotationLegend({ annotations }: { annotations: TimelineAnnotation[] }) {
  if (annotations.length === 0) {
    return null;
  }

  return (
    <Group gap={8} wrap="wrap" className={classes.chartAnnotationLegend}>
      {annotations.map((annotation) => (
        <span key={annotation.key} className={classes.chartAnnotationChip} aria-hidden="true">
          <span className={classes.chartAnnotationDot} style={{ backgroundColor: annotation.color }} />
        </span>
      ))}
    </Group>
  );
}

export function ReportsClient({ payload, filterOptions, isDemo = false }: ReportsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [filtersOpened, setFiltersOpened] = useState(false);

  const currentSearchString = searchParams?.toString() ?? '';

  const updateSearch = (mutate: (params: URLSearchParams) => void) => {
    const nextParams = new URLSearchParams(currentSearchString);
    mutate(nextParams);
    nextParams.set('scope', resolveScope(nextParams));

    startTransition(() => {
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
    });
  };

  const exportLinks = useMemo(() => {
    const nextParams = new URLSearchParams(currentSearchString);

    if (isDemo) {
      nextParams.set('demo', '1');
    }

    const query = nextParams.toString() ? `?${nextParams.toString()}` : '';

    return {
      pdf: `/api/reports/pdf${query}`,
      csv: `/api/reports/csv${query}`,
    };
  }, [currentSearchString, isDemo]);

  const activeFilterCount = useMemo(() => getActiveFilterCount(payload), [payload]);
  const visibleFilterSummary = useMemo(
    () =>
      payload.export.filterSummary.filter((item) => {
        if (item.label === 'Date range' || item.label === 'Range') {
          return true;
        }

        if (item.label === 'Compare' && item.value === 'None') {
          return false;
        }

        return !item.value.startsWith('All ');
      }),
    [payload.export.filterSummary]
  );
  const [primaryAnalyticsMode, setPrimaryAnalyticsMode] =
    useState<ReportAnalyticsMode>('ranking');
  const [secondaryAnalyticsMode, setSecondaryAnalyticsMode] =
    useState<ReportAnalyticsMode>('efficiency');
  const breadcrumbs = useMemo(
    () => buildReportBreadcrumbs(payload, filterOptions),
    [filterOptions, payload]
  );

  return (
    <Container fluid px={6} py={0} className={`${classes.page} reports-page-shell`}>
      <Drawer
        opened={filtersOpened}
        onClose={() => setFiltersOpened(false)}
        title="Report filters"
        position="right"
        size="md"
      >
        <ReportsSidebar
          query={payload.query}
          filterOptions={filterOptions}
          onUpdate={(mutate) => {
            setFiltersOpened(false);
            updateSearch(mutate);
          }}
        />
      </Drawer>

      <Stack gap="md" className={classes.shell}>
        <ReportsHeader
          payload={payload}
          exportLinks={exportLinks}
          onUpdate={updateSearch}
          onOpenFilters={() => setFiltersOpened(true)}
          activeFilterCount={activeFilterCount}
          isDemo={isDemo}
          isPending={isPending}
        />

        {breadcrumbs.length > 0 ? (
          <Paper withBorder radius="xl" p="md" className={classes.breadcrumbCard}>
            <Group gap="xs" wrap="wrap">
              <Text size="xs" c="dimmed" tt="uppercase" fw={800}>
                Report path
              </Text>
              {breadcrumbs.map((item, index) => (
                <Group key={`${item.label}:${index}`} gap="xs" wrap="nowrap">
                  {index > 0 ? <IconChevronRight size={14} color="#94a3b8" /> : null}
                  {item.href ? (
                    <Button
                      component={Link}
                      href={item.href}
                      variant="subtle"
                      size="compact-xs"
                      radius="xl"
                    >
                      {item.label}
                    </Button>
                  ) : (
                    <Badge color="orange" variant="light" radius="sm">
                      {item.label}
                    </Badge>
                  )}
                </Group>
              ))}
            </Group>
          </Paper>
        ) : null}

        {payload.meta.syncCoverage?.historicalAnalysisPending ? (
          <Paper
            radius="xl"
            p="md"
            bg="rgba(253,75,35,0.08)"
            style={{ border: '1px solid rgba(253,75,35,0.18)' }}
          >
            <Group justify="space-between" align="flex-start" gap="md">
              <div>
                <Text fw={800}>Recent coverage is ready while full history sync continues</Text>
                <Text size="sm" c="dimmed" mt={4}>
                  {payload.meta.syncCoverage.coverageStartDate &&
                  payload.meta.syncCoverage.coverageEndDate
                    ? `This report currently reflects synced data from ${payload.meta.syncCoverage.coverageStartDate} through ${payload.meta.syncCoverage.coverageEndDate}.`
                    : 'DeepVisor is still expanding the history window for this selected ad account.'}
                </Text>
              </div>
              <Badge color="orange" variant="light">
                {payload.meta.syncCoverage.activeJobStatus ?? 'pending'}
              </Badge>
            </Group>
          </Paper>
        ) : null}

        {isPending && (
          <Card withBorder radius="lg" p="sm">
            <Group gap="sm">
              <Loader size="sm" />
              <Text size="sm" c="dimmed">
                Updating report…
              </Text>
            </Group>
          </Card>
        )}

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {payload.kpis.map((kpi) => (
            <KpiCard key={kpi.key} kpi={kpi} />
          ))}
        </SimpleGrid>

        <Grid gutter="md" align="stretch">
          <Grid.Col span={{ base: 12, xl: 6 }}>
            <ReportAnalyticsPanel
              payload={payload}
              mode={primaryAnalyticsMode}
              blockedMode={secondaryAnalyticsMode}
              onModeChange={setPrimaryAnalyticsMode}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, xl: 6 }}>
            <ReportAnalyticsPanel
              payload={payload}
              mode={secondaryAnalyticsMode}
              blockedMode={primaryAnalyticsMode}
              onModeChange={setSecondaryAnalyticsMode}
            />
          </Grid.Col>
        </Grid>

        <RankedEntityBoard
          rows={payload.breakdown.rows}
          currencyCode={payload.meta.currencyCode}
          ranking={payload.ranking}
          query={payload.query}
        />

        <Card withBorder radius="xl" p="lg" className={`${classes.reportCard} ${classes.tableCard}`}>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start" gap="md" wrap="wrap" className={classes.cardHeader}>
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={800}>
                  Performance table
                </Text>
                <Text fw={900} size="xl" mt={4}>
                  {payload.breakdown.title}
                </Text>
                <Text size="sm" c="dimmed" mt={4}>
                  Full row-level view for campaigns, ad sets, or ads in the current filters.
                </Text>
              </div>
              <Group gap="xs" wrap="wrap">
                {visibleFilterSummary.map((item) => (
                  <Badge key={`${item.label}:${item.value}`} variant="light" color="gray" radius="sm">
                    {item.label}: {item.value}
                  </Badge>
                ))}
              </Group>
            </Group>

            <PerformanceTable
              title={payload.breakdown.title}
              rows={payload.breakdown.rows}
              currencyCode={payload.meta.currencyCode}
              hideTitle
            />
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
