type HeaderReader = {
  get(name: string): string | null;
};

export function getForwardedOrigin(
  headers: HeaderReader,
  fallbackOrigin: string
): string {
  const forwardedHost = headers.get('x-forwarded-host')?.split(',')[0]?.trim();

  if (!forwardedHost) {
    return fallbackOrigin;
  }

  const forwardedProto =
    headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    (forwardedHost.includes('localhost') || forwardedHost.startsWith('127.0.0.1')
      ? 'http'
      : 'https');

  return `${forwardedProto}://${forwardedHost}`;
}
