import crypto from 'node:crypto';

export type MetaDeletionPayload = {
  user_id?: unknown;
  issued_at?: unknown;
  algorithm?: unknown;
  [key: string]: unknown;
};

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64');
}

export function base64UrlEncode(value: Buffer): string {
  return value.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function verifyMetaSignedRequest(
  signedRequest: string,
  appSecret = process.env.META_APP_SECRET
): MetaDeletionPayload {
  if (!appSecret) {
    throw new Error('Meta app secret is not configured');
  }

  const [encodedSignature, encodedPayload] = signedRequest.split('.');
  if (!encodedSignature || !encodedPayload) {
    throw new Error('Invalid signed request format');
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8')) as MetaDeletionPayload;
  const algorithm = typeof payload.algorithm === 'string' ? payload.algorithm.toUpperCase() : null;
  if (algorithm !== 'HMAC-SHA256') {
    throw new Error('Unsupported signed request algorithm');
  }

  const expectedSignature = base64UrlEncode(
    crypto.createHmac('sha256', appSecret).update(encodedPayload).digest()
  );
  const actual = Buffer.from(encodedSignature);
  const expected = Buffer.from(expectedSignature);

  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    throw new Error('Invalid signed request signature');
  }

  return payload;
}
