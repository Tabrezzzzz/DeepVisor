import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { base64UrlEncode, verifyMetaSignedRequest } from './metaSignedRequest';

function signPayload(payload: Record<string, unknown>, appSecret: string): string {
  const encodedPayload = base64UrlEncode(Buffer.from(JSON.stringify(payload), 'utf8'));
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', appSecret).update(encodedPayload).digest()
  );

  return `${signature}.${encodedPayload}`;
}

describe('verifyMetaSignedRequest', () => {
  it('returns the verified Meta payload for a valid HMAC-SHA256 signed request', () => {
    const signedRequest = signPayload(
      {
        algorithm: 'HMAC-SHA256',
        issued_at: 1783516412,
        user_id: 'meta-user-123',
      },
      'app-secret'
    );

    expect(verifyMetaSignedRequest(signedRequest, 'app-secret')).toMatchObject({
      algorithm: 'HMAC-SHA256',
      issued_at: 1783516412,
      user_id: 'meta-user-123',
    });
  });

  it('rejects a tampered payload', () => {
    const signedRequest = signPayload(
      {
        algorithm: 'HMAC-SHA256',
        user_id: 'meta-user-123',
      },
      'app-secret'
    );
    const [, encodedPayload] = signedRequest.split('.');
    const tamperedPayload = base64UrlEncode(
      Buffer.from(JSON.stringify({ algorithm: 'HMAC-SHA256', user_id: 'attacker' }), 'utf8')
    );

    expect(() => verifyMetaSignedRequest(`${signedRequest.split('.')[0]}.${tamperedPayload}`, 'app-secret')).toThrow(
      'Invalid signed request signature'
    );
    expect(encodedPayload).not.toBe(tamperedPayload);
  });

  it('rejects unsupported algorithms', () => {
    const signedRequest = signPayload(
      {
        algorithm: 'PLAINTEXT',
        user_id: 'meta-user-123',
      },
      'app-secret'
    );

    expect(() => verifyMetaSignedRequest(signedRequest, 'app-secret')).toThrow(
      'Unsupported signed request algorithm'
    );
  });

  it('requires an app secret', () => {
    const signedRequest = signPayload(
      {
        algorithm: 'HMAC-SHA256',
        user_id: 'meta-user-123',
      },
      'app-secret'
    );

    expect(() => verifyMetaSignedRequest(signedRequest, '')).toThrow(
      'Meta app secret is not configured'
    );
  });
});
