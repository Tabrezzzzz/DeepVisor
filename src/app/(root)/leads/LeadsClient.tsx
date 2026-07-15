'use client';

import { useMemo, useState } from 'react';
import type React from 'react';
import {
  ArrowDownUp,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  Inbox,
  Mail,
  MapPin,
  MousePointer2,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export type LeadRecord = {
  id: string;
  externalLeadId: string;
  externalFormId: string | null;
  formId: string | null;
  formName: string | null;
  pageId: string | null;
  campaignExternalId: string | null;
  campaignName: string | null;
  adsetExternalId: string | null;
  adsetName: string | null;
  adExternalId: string | null;
  adName: string | null;
  source: string;
  status: string;
  quality: string;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  city: string | null;
  rawFields: Record<string, unknown>;
  submittedAt: string;
  firstContactedAt: string | null;
  qualifiedAt: string | null;
  bookedAt: string | null;
  lostAt: string | null;
  notes: string | null;
};

export type LeadFormOption = {
  id: string;
  externalFormId: string;
  pageId: string | null;
  pageName: string | null;
  name: string;
  status: string | null;
  leadsCount: number | null;
  lastSyncedAt: string | null;
};

export type LeadPageOption = {
  id: string;
  externalPageId: string;
  name: string;
  lastSyncedAt: string | null;
};

type FilterState = {
  search: string;
  status: string;
  quality: string;
  campaign: string;
  source: string;
  contactField: string;
  dateFrom: string;
  dateTo: string;
  sort: string;
};

type SourcePage = {
  id: string;
  name: string;
  formsCount: number;
  leadsCount: number;
  lastSyncedAt: string | null;
};

const emptyFilters: FilterState = {
  search: '',
  status: 'all',
  quality: 'all',
  campaign: 'all',
  source: 'all',
  contactField: 'all',
  dateFrom: '',
  dateTo: '',
  sort: 'newest',
};

const qualityRank: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
  unknown: 0,
};

function inputValue(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): string {
  return event.currentTarget.value;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

function formatDate(value: string | null): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value: string | null): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function labelize(value: string | null | undefined): string {
  if (!value) return 'Unknown';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function fieldText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function searchableText(lead: LeadRecord): string {
  return [
    lead.externalLeadId,
    lead.formName,
    lead.campaignName,
    lead.adsetName,
    lead.adName,
    lead.fullName,
    lead.email,
    lead.phoneNumber,
    lead.city,
    lead.notes,
    ...Object.values(lead.rawFields).map(fieldText),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function hasContactField(lead: LeadRecord, field: string): boolean {
  if (field === 'email') return Boolean(lead.email);
  if (field === 'phone') return Boolean(lead.phoneNumber);
  if (field === 'name') return Boolean(lead.fullName);
  if (field === 'city') return Boolean(lead.city);
  return true;
}

function isWithinDateRange(lead: LeadRecord, from: string, to: string): boolean {
  const submitted = new Date(lead.submittedAt).getTime();
  if (!Number.isFinite(submitted)) return false;

  if (from) {
    const fromMs = new Date(`${from}T00:00:00.000Z`).getTime();
    if (Number.isFinite(fromMs) && submitted < fromMs) return false;
  }

  if (to) {
    const toMs = new Date(`${to}T23:59:59.999Z`).getTime();
    if (Number.isFinite(toMs) && submitted > toMs) return false;
  }

  return true;
}

function uniqueOptions(values: string[]): Array<{ value: string; label: string }> {
  return Array.from(new Set(values.filter(Boolean)))
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({ value, label: labelize(value) }));
}

function leadInitials(lead: LeadRecord): string {
  const source = lead.fullName || lead.email || lead.phoneNumber || 'Lead';
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function leadDisplayName(lead: LeadRecord): string {
  return lead.fullName || lead.email || lead.phoneNumber || 'Unnamed lead';
}

function exportCsv(leads: LeadRecord[]) {
  const columns = [
    'Name',
    'Email',
    'Phone',
    'City',
    'Status',
    'Quality',
    'Campaign',
    'Form',
    'Submitted',
  ];
  const rows = leads.map((lead) => [
    leadDisplayName(lead),
    lead.email ?? '',
    lead.phoneNumber ?? '',
    lead.city ?? '',
    labelize(lead.status),
    labelize(lead.quality),
    lead.campaignName ?? lead.campaignExternalId ?? '',
    lead.formName ?? lead.externalFormId ?? '',
    lead.submittedAt,
  ]);
  const csv = [columns, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `deepvisor-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function MetricCard({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'risk' | 'dark';
}) {
  return (
    <article className={`dv-leads-metric ${tone === 'risk' ? 'is-risk' : ''} ${tone === 'dark' ? 'is-dark' : ''}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function EmptyLeadsState({ onRefresh, syncing }: { onRefresh: () => void; syncing: boolean }) {
  return (
    <div className="dv-leads-empty">
      <div className="dv-leads-empty-icon">
        <Inbox size={24} strokeWidth={1.7} />
      </div>
      <h3>No leads match this view</h3>
      <p>
        Refresh Meta leads or widen the filters. Synced lead forms and submissions will appear in
        this inbox as soon as Meta returns them.
      </p>
      <button type="button" onClick={onRefresh} disabled={syncing}>
        <RefreshCw size={16} strokeWidth={1.8} />
        {syncing ? 'Refreshing...' : 'Refresh leads'}
      </button>
    </div>
  );
}

export default function LeadsClient({
  accountName,
  platformName,
  leads,
  forms,
  pages,
}: {
  accountName: string;
  platformName: string;
  leads: LeadRecord[];
  forms: LeadFormOption[];
  pages: LeadPageOption[];
}) {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [selectedPageId, setSelectedPageId] = useState<string>('all');
  const [selectedFormId, setSelectedFormId] = useState<string>('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(leads[0]?.id ?? null);
  const [showFilters, setShowFilters] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const pageOptions = useMemo<SourcePage[]>(() => {
    const byPageId = new Map<string, SourcePage>();

    for (const page of pages) {
      byPageId.set(page.externalPageId, {
        id: page.externalPageId,
        name: page.name,
        formsCount: 0,
        leadsCount: 0,
        lastSyncedAt: page.lastSyncedAt,
      });
    }

    for (const form of forms) {
      const pageId = form.pageId ?? 'unknown';
      const current = byPageId.get(pageId);
      byPageId.set(pageId, {
        id: pageId,
        name: form.pageName || current?.name || (pageId === 'unknown' ? 'Unknown page' : pageId),
        formsCount: (current?.formsCount ?? 0) + 1,
        leadsCount: (current?.leadsCount ?? 0) + (form.leadsCount ?? 0),
        lastSyncedAt: current?.lastSyncedAt ?? form.lastSyncedAt,
      });
    }

    for (const lead of leads) {
      const pageId = lead.pageId ?? 'unknown';
      const current = byPageId.get(pageId);
      byPageId.set(pageId, {
        id: pageId,
        name: current?.name || (pageId === 'unknown' ? 'Unknown page' : pageId),
        formsCount: current?.formsCount ?? 0,
        leadsCount: (current?.leadsCount ?? 0) + 1,
        lastSyncedAt: current?.lastSyncedAt ?? null,
      });
    }

    return Array.from(byPageId.values()).sort((left, right) => right.leadsCount - left.leadsCount);
  }, [forms, leads, pages]);

  const scopedForms = useMemo(
    () =>
      selectedPageId === 'all'
        ? forms
        : forms.filter((form) => (form.pageId ?? 'unknown') === selectedPageId),
    [forms, selectedPageId]
  );

  const scopedLeads = useMemo(
    () =>
      leads.filter((lead) => {
        if (selectedPageId !== 'all' && (lead.pageId ?? 'unknown') !== selectedPageId) return false;
        if (selectedFormId !== 'all' && lead.formId !== selectedFormId) return false;
        return true;
      }),
    [leads, selectedFormId, selectedPageId]
  );

  const filterOptions = useMemo(() => {
    return {
      campaigns: [
        { value: 'all', label: 'All campaigns' },
        ...uniqueOptions(scopedLeads.map((lead) => lead.campaignName || lead.campaignExternalId || '')),
      ],
      sources: [{ value: 'all', label: 'All sources' }, ...uniqueOptions(scopedLeads.map((lead) => lead.source))],
      statuses: [{ value: 'all', label: 'All statuses' }, ...uniqueOptions(scopedLeads.map((lead) => lead.status))],
      qualities: [{ value: 'all', label: 'All quality' }, ...uniqueOptions(scopedLeads.map((lead) => lead.quality))],
    };
  }, [scopedLeads]);

  const filteredLeads = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return scopedLeads
      .filter((lead) => {
        if (search && !searchableText(lead).includes(search)) return false;
        if (filters.status !== 'all' && lead.status !== filters.status) return false;
        if (filters.quality !== 'all' && lead.quality !== filters.quality) return false;
        if (
          filters.campaign !== 'all' &&
          lead.campaignName !== filters.campaign &&
          lead.campaignExternalId !== filters.campaign
        ) return false;
        if (filters.source !== 'all' && lead.source !== filters.source) return false;
        if (!hasContactField(lead, filters.contactField)) return false;
        return isWithinDateRange(lead, filters.dateFrom, filters.dateTo);
      })
      .sort((left, right) => {
        if (filters.sort === 'oldest') {
          return new Date(left.submittedAt).getTime() - new Date(right.submittedAt).getTime();
        }
        if (filters.sort === 'quality') {
          return (qualityRank[right.quality] ?? 0) - (qualityRank[left.quality] ?? 0);
        }
        if (filters.sort === 'status') {
          return labelize(left.status).localeCompare(labelize(right.status));
        }
        return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
      });
  }, [filters, scopedLeads]);

  const analytics = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const contacted = scopedLeads.filter((lead) => lead.firstContactedAt || lead.status === 'contacted').length;
    const qualified = scopedLeads.filter((lead) => lead.qualifiedAt || lead.status === 'qualified').length;
    const booked = scopedLeads.filter((lead) => lead.bookedAt || lead.status === 'booked').length;
    const last7 = scopedLeads.filter((lead) => new Date(lead.submittedAt).getTime() >= sevenDaysAgo).length;
    const last30 = scopedLeads.filter((lead) => new Date(lead.submittedAt).getTime() >= thirtyDaysAgo).length;
    const newestTime = scopedLeads
      .map((lead) => new Date(lead.submittedAt).getTime())
      .filter(Number.isFinite)
      .sort((left, right) => right - left)[0];

    return {
      total: scopedLeads.length,
      visible: filteredLeads.length,
      contacted,
      qualified,
      booked,
      last7,
      last30,
      newest: newestTime ? new Date(newestTime).toISOString() : null,
      contactedRate: scopedLeads.length ? Math.round((contacted / scopedLeads.length) * 100) : 0,
      qualifiedRate: scopedLeads.length ? Math.round((qualified / scopedLeads.length) * 100) : 0,
      bookedRate: scopedLeads.length ? Math.round((booked / scopedLeads.length) * 100) : 0,
    };
  }, [filteredLeads.length, scopedLeads]);

  const selectedLead =
    filteredLeads.find((lead) => lead.id === selectedLeadId) ?? filteredLeads[0] ?? null;

  const syncLeads = async () => {
    setSyncing(true);
    setSyncMessage(null);

    try {
      const response = await fetch('/api/leads/meta/sync', { method: 'POST' });
      const body = (await response.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
      } | null;

      if (!response.ok || body?.success === false) {
        throw new Error(body?.message || 'Lead sync failed.');
      }

      setSyncMessage(body?.message || 'Lead sync completed.');
      router.refresh();
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'Lead sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const selectPage = (pageId: string) => {
    setSelectedPageId(pageId);
    setSelectedFormId('all');
    setSelectedLeadId(null);
    setFilters(emptyFilters);
  };

  const selectForm = (formId: string) => {
    setSelectedFormId(formId);
    setSelectedLeadId(null);
    setFilters(emptyFilters);
  };

  return (
    <section className="dv-page dv-leads-page">
      <div className="dv-leads-hero">
        <div>
          <div className="dv-leads-kicker">
            <span>Lead command center</span>
            <span>{platformName}</span>
            <span>{accountName}</span>
          </div>
          <h2>Lead inbox</h2>
          <p>
            Inspect synced Meta lead forms, submissions, contactability, campaign source, and
            qualification movement from one operational screen.
          </p>
        </div>
        <div className="dv-leads-hero-actions">
          <button type="button" className="dv-leads-ghost-button" onClick={() => exportCsv(filteredLeads)}>
            <Download size={16} strokeWidth={1.8} />
            Export visible
          </button>
          <button type="button" className="dv-leads-primary-button" onClick={syncLeads} disabled={syncing}>
            <RefreshCw size={16} strokeWidth={1.8} className={syncing ? 'is-spinning' : ''} />
            {syncing ? 'Refreshing' : 'Refresh Meta leads'}
          </button>
        </div>
      </div>

      {syncMessage ? (
        <div className="dv-inline-snackbar">
          <Sparkles size={16} strokeWidth={1.8} />
          {syncMessage}
        </div>
      ) : null}

      <div className="dv-leads-metrics">
        <MetricCard label="Visible leads" value={formatNumber(analytics.visible)} detail={`${formatNumber(analytics.total)} in selected scope`} tone="dark" />
        <MetricCard label="Last 7 days" value={formatNumber(analytics.last7)} detail={`${formatNumber(analytics.last30)} in last 30 days`} />
        <MetricCard label="Contacted" value={`${analytics.contactedRate}%`} detail={`${formatNumber(analytics.contacted)} leads touched`} />
        <MetricCard label="Qualified" value={`${analytics.qualifiedRate}%`} detail={`${formatNumber(analytics.qualified)} qualified`} />
        <MetricCard label="Booked" value={`${analytics.bookedRate}%`} detail={`${formatNumber(analytics.booked)} booked`} tone="risk" />
      </div>

      <div className="dv-leads-workspace">
        <aside className="dv-leads-source-panel">
          <div className="dv-leads-panel-heading">
            <p>Sources</p>
            <strong>{formatNumber(pageOptions.length)} pages</strong>
          </div>

          <button
            type="button"
            className={`dv-leads-source-item ${selectedPageId === 'all' ? 'is-active' : ''}`}
            onClick={() => selectPage('all')}
          >
            <span>All pages</span>
            <strong>{formatNumber(leads.length)}</strong>
          </button>

          {pageOptions.map((page) => (
            <button
              type="button"
              key={page.id}
              className={`dv-leads-source-item ${selectedPageId === page.id ? 'is-active' : ''}`}
              onClick={() => selectPage(page.id)}
            >
              <span>{page.name}</span>
              <small>{formatNumber(page.formsCount)} forms</small>
              <strong>{formatNumber(page.leadsCount)}</strong>
            </button>
          ))}

          <div className="dv-leads-form-list">
            <div className="dv-leads-panel-heading">
              <p>Forms</p>
              <strong>{formatNumber(scopedForms.length)}</strong>
            </div>
            <button
              type="button"
              className={`dv-leads-form-chip ${selectedFormId === 'all' ? 'is-active' : ''}`}
              onClick={() => selectForm('all')}
            >
              All forms
            </button>
            {scopedForms.slice(0, 12).map((form) => (
              <button
                type="button"
                key={form.id}
                className={`dv-leads-form-chip ${selectedFormId === form.id ? 'is-active' : ''}`}
                onClick={() => selectForm(form.id)}
                title={form.name}
              >
                <span>{form.name}</span>
                <small>{formatNumber(form.leadsCount ?? 0)}</small>
              </button>
            ))}
          </div>
        </aside>

        <main className="dv-leads-inbox">
          <div className="dv-leads-toolbar">
            <label className="dv-leads-search">
              <Search size={16} strokeWidth={1.8} />
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: inputValue(event) }))}
                placeholder="Search name, phone, email, city, campaign"
              />
            </label>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: inputValue(event) }))}
            >
              {filterOptions.statuses.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={filters.quality}
              onChange={(event) => setFilters((current) => ({ ...current, quality: inputValue(event) }))}
            >
              {filterOptions.qualities.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button type="button" onClick={() => setShowFilters((current) => !current)}>
              <Filter size={16} strokeWidth={1.8} />
              Filters
            </button>
          </div>

          {showFilters ? (
            <div className="dv-leads-filter-row">
              <select
                value={filters.campaign}
                onChange={(event) => setFilters((current) => ({ ...current, campaign: inputValue(event) }))}
              >
                {filterOptions.campaigns.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={filters.source}
                onChange={(event) => setFilters((current) => ({ ...current, source: inputValue(event) }))}
              >
                {filterOptions.sources.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={filters.contactField}
                onChange={(event) => setFilters((current) => ({ ...current, contactField: inputValue(event) }))}
              >
                <option value="all">Any contact data</option>
                <option value="name">Has name</option>
                <option value="email">Has email</option>
                <option value="phone">Has phone</option>
                <option value="city">Has city</option>
              </select>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(event) => setFilters((current) => ({ ...current, dateFrom: inputValue(event) }))}
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(event) => setFilters((current) => ({ ...current, dateTo: inputValue(event) }))}
              />
              <select
                value={filters.sort}
                onChange={(event) => setFilters((current) => ({ ...current, sort: inputValue(event) }))}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="quality">Quality first</option>
                <option value="status">Status A-Z</option>
              </select>
              <button type="button" onClick={() => setFilters(emptyFilters)}>
                Reset
              </button>
            </div>
          ) : null}

          <div className="dv-leads-table-card">
            <div className="dv-leads-table-head">
              <span>Lead</span>
              <span>Signal</span>
              <span>Campaign</span>
              <span>Submitted</span>
              <span>Stage</span>
            </div>

            {filteredLeads.length === 0 ? (
              <EmptyLeadsState onRefresh={syncLeads} syncing={syncing} />
            ) : (
              <div className="dv-leads-table-body">
                {filteredLeads.map((lead) => (
                  <button
                    type="button"
                    key={lead.id}
                    className={`dv-leads-row ${selectedLead?.id === lead.id ? 'is-active' : ''}`}
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    <span className="dv-leads-person">
                      <i>{leadInitials(lead)}</i>
                      <span>
                        <strong>{leadDisplayName(lead)}</strong>
                        <small>{lead.email || lead.phoneNumber || lead.externalLeadId}</small>
                      </span>
                    </span>
                    <span className="dv-leads-signal">
                      <b className={`dv-leads-quality is-${lead.quality}`}>{labelize(lead.quality)}</b>
                      <small>{labelize(lead.source)}</small>
                    </span>
                    <span>
                      <strong>{lead.campaignName || 'Unknown campaign'}</strong>
                      <small>{lead.formName || lead.externalFormId || 'Unknown form'}</small>
                    </span>
                    <span>
                      <strong>{formatDateTime(lead.submittedAt)}</strong>
                      <small>{lead.city || 'No city'}</small>
                    </span>
                    <span>
                      <b className={`dv-leads-status is-${lead.status}`}>{labelize(lead.status)}</b>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>

        <aside className="dv-leads-detail-panel">
          <div className="dv-leads-panel-heading">
            <p>Lead detail</p>
            <strong>{selectedLead ? labelize(selectedLead.status) : 'None'}</strong>
          </div>

          {selectedLead ? (
            <>
              <div className="dv-leads-detail-identity">
                <i>{leadInitials(selectedLead)}</i>
                <h3>{leadDisplayName(selectedLead)}</h3>
                <p>{selectedLead.externalLeadId}</p>
              </div>

              <div className="dv-leads-contact-stack">
                <span><Mail size={15} strokeWidth={1.8} />{selectedLead.email || 'No email'}</span>
                <span><Phone size={15} strokeWidth={1.8} />{selectedLead.phoneNumber || 'No phone'}</span>
                <span><MapPin size={15} strokeWidth={1.8} />{selectedLead.city || 'No city'}</span>
              </div>

              <div className="dv-leads-stage-card">
                <div>
                  <CheckCircle2 size={18} strokeWidth={1.8} />
                  <span>Qualified</span>
                  <strong>{selectedLead.qualifiedAt ? formatDate(selectedLead.qualifiedAt) : 'Pending'}</strong>
                </div>
                <div>
                  <Clock3 size={18} strokeWidth={1.8} />
                  <span>First contact</span>
                  <strong>{selectedLead.firstContactedAt ? formatDate(selectedLead.firstContactedAt) : 'Pending'}</strong>
                </div>
              </div>

              <dl className="dv-leads-detail-list">
                <div>
                  <dt>Campaign</dt>
                  <dd>{selectedLead.campaignName || selectedLead.campaignExternalId || 'Unknown campaign'}</dd>
                </div>
                <div>
                  <dt>Ad set / ad</dt>
                  <dd>{selectedLead.adsetName || 'Unknown ad set'} / {selectedLead.adName || 'Unknown ad'}</dd>
                </div>
                <div>
                  <dt>Form</dt>
                  <dd>{selectedLead.formName || selectedLead.externalFormId || 'Unknown form'}</dd>
                </div>
                <div>
                  <dt>Submitted</dt>
                  <dd>{formatDateTime(selectedLead.submittedAt)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <div className="dv-leads-empty compact">
              <MousePointer2 size={22} strokeWidth={1.8} />
              <h3>Select a lead</h3>
              <p>Lead detail appears here after selecting a row.</p>
            </div>
          )}

          <div className="dv-leads-mini-chart">
            <div>
              <span style={{ height: `${Math.max(12, analytics.contactedRate)}%` }} />
              <small>Contacted</small>
            </div>
            <div>
              <span style={{ height: `${Math.max(12, analytics.qualifiedRate)}%` }} />
              <small>Qualified</small>
            </div>
            <div>
              <span style={{ height: `${Math.max(12, analytics.bookedRate)}%` }} />
              <small>Booked</small>
            </div>
          </div>

          <div className="dv-leads-freshness">
            <ArrowDownUp size={16} strokeWidth={1.8} />
            <span>Newest synced lead: {formatDate(analytics.newest)}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
