import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { hashPassword, shouldUseSecureCookie, verifyPassword } from '../auth';

describe('Local account authentication', () => {
  it('hashes passwords with a unique salt and verifies only the matching password', async () => {
    const firstHash = await hashPassword('correct horse battery staple');
    const secondHash = await hashPassword('correct horse battery staple');

    expect(firstHash).not.toBe(secondHash);
    expect(await verifyPassword('correct horse battery staple', firstHash)).toBe(true);
    expect(await verifyPassword('wrong password', firstHash)).toBe(false);
    expect(await verifyPassword('correct horse battery staple', 'bad:hash')).toBe(false);
  });

  it('sends session cookies over plain HTTP for LAN and Tailscale IP access', () => {
    const lanRequest = new NextRequest('http://192.168.1.10:3100/api/auth/login');
    const tailscaleRequest = new NextRequest('http://100.86.131.85:3100/api/auth/login');

    expect(shouldUseSecureCookie(lanRequest)).toBe(false);
    expect(shouldUseSecureCookie(tailscaleRequest)).toBe(false);
  });

  it('marks session cookies secure behind HTTPS and an HTTPS reverse proxy', () => {
    const httpsRequest = new NextRequest('https://finance.example.com/api/auth/login');
    const proxiedRequest = new NextRequest('http://finance.example.com/api/auth/login', {
      headers: { 'x-forwarded-proto': 'https' },
    });

    expect(shouldUseSecureCookie(httpsRequest)).toBe(true);
    expect(shouldUseSecureCookie(proxiedRequest)).toBe(true);
  });
});
