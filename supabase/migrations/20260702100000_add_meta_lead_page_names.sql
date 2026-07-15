alter table public.meta_lead_forms
  add column if not exists page_name text;

create index if not exists meta_lead_forms_page_idx
  on public.meta_lead_forms(platform_integration_id, page_id);

notify pgrst, 'reload schema';
