insert into public.platforms (key, name, api_info)
values (
  'google',
  'Google Ads',
  jsonb_build_object(
    'description', 'Search, Display, YouTube, and Performance Max coverage.',
    'full_description', 'Connect Google Ads to centralize spend, conversion, and campaign reporting.',
    'strengths', 'High-intent traffic and strong conversion capture across search inventory.',
    'weaknesses', 'Competitive auctions can increase CPC in saturated markets.',
    'image_url', '/images/platforms/logo/google.png'
  )
)
on conflict (key) do update set
  name = excluded.name,
  api_info = excluded.api_info,
  updated_at = now();
