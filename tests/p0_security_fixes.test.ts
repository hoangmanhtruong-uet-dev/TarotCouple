import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { middleware } from '../src/middleware';
import { NextRequest } from 'next/server';
import { isAdminRequest } from '../src/lib/quota-store';
import { GET as getHealth } from '../src/app/api/health/route';
import { GET as getAdminAuth, POST as postAdminAuth } from '../src/app/api/admin/auth/route';

describe('P0 Security Hotfixes Verification Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. Middleware: PayOS Webhook route exclusion under maintenance mode (SEC-01)', () => {
    it('does NOT rewrite /api/pay/webhook even when MAINTENANCE_MODE is active', () => {
      process.env.MAINTENANCE_MODE = 'true';
      const req = new NextRequest('http://localhost:3000/api/pay/webhook', {
        method: 'POST',
      });
      const res = middleware(req);
      // Excluded paths pass through without rewriting to /maintenance
      expect(res.headers.get('x-middleware-rewrite')).toBeNull();
      expect(res.status).toBe(200);
    });

    it('does NOT rewrite /api/payment/webhook even when MAINTENANCE_MODE is active', () => {
      process.env.MAINTENANCE_MODE = 'true';
      const req = new NextRequest('http://localhost:3000/api/payment/webhook', {
        method: 'POST',
      });
      const res = middleware(req);
      expect(res.headers.get('x-middleware-rewrite')).toBeNull();
      expect(res.status).toBe(200);
    });

    it('rewrites public user route to /maintenance when MAINTENANCE_MODE is active', () => {
      process.env.MAINTENANCE_MODE = 'true';
      const req = new NextRequest('http://localhost:3000/reading/rut-bai');
      const res = middleware(req);
      expect(res.headers.get('x-middleware-rewrite')).toContain('/maintenance');
      expect(res.headers.get('Retry-After')).toBe('1800');
    });

    it('sets tc_admin_secret cookie when ?admin=<secret> is provided', () => {
      process.env.ADMIN_SECRET = 'my_super_secret_admin_key_999';
      const req = new NextRequest('http://localhost:3000/admin/funnel?admin=my_super_secret_admin_key_999');
      const res = middleware(req);
      expect(res.status).toBe(307); // redirect to clean URL
      const cookies = res.headers.get('set-cookie') || '';
      expect(cookies).toContain('tc_admin_secret=my_super_secret_admin_key_999');
    });
  });

  describe('2. Admin Authentication API & Health Diagnostics Masking (SEC-02)', () => {
    it('GET /api/admin/auth returns 401 when unauthenticated', async () => {
      process.env.ADMIN_SECRET = 'test_secret_123';
      const req = new Request('http://localhost:3000/api/admin/auth');
      const res = await getAdminAuth(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.authenticated).toBe(false);
    });

    it('POST /api/admin/auth rejects incorrect secret with 401', async () => {
      process.env.ADMIN_SECRET = 'test_secret_123';
      const req = new Request('http://localhost:3000/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: 'wrong_secret' }),
      });
      const res = await postAdminAuth(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('POST /api/admin/auth accepts correct secret, sets tc_admin_secret cookie', async () => {
      process.env.ADMIN_SECRET = 'test_secret_123';
      const req = new Request('http://localhost:3000/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: 'test_secret_123' }),
      });
      const res = await postAdminAuth(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      const setCookie = res.headers.get('set-cookie') || '';
      expect(setCookie).toContain('tc_admin_secret=test_secret_123');
      expect(setCookie).toContain('HttpOnly');
    });

    it('POST /api/admin/auth handles logout action by clearing cookie', async () => {
      const req = new Request('http://localhost:3000/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      const res = await postAdminAuth(req);
      expect(res.status).toBe(200);
      const setCookie = res.headers.get('set-cookie') || '';
      expect(setCookie).toContain('tc_admin_secret=;');
    });

    it('isAdminRequest verifies cookie tc_admin_secret', () => {
      process.env.ADMIN_SECRET = 'vault_key_abc_123';
      const reqWithCookie = new Request('http://localhost:3000/api/reading', {
        headers: {
          cookie: 'tc_sid=abc.123; tc_admin_secret=vault_key_abc_123',
        },
      });
      expect(isAdminRequest(reqWithCookie)).toBe(true);

      const reqWithWrongCookie = new Request('http://localhost:3000/api/reading', {
        headers: {
          cookie: 'tc_admin_secret=wrong_val',
        },
      });
      expect(isAdminRequest(reqWithWrongCookie)).toBe(false);
    });

    it('GET /api/health masks clientIdPrefix from anonymous users but reveals to admin', async () => {
      process.env.ADMIN_SECRET = 'admin_vault_pass';
      process.env.PAYOS_CLIENT_ID = 'test-client-id-12345';

      // Anonymous request -> masked / empty prefix
      const anonReq = new Request('http://localhost:3000/api/health');
      const anonRes = await getHealth(anonReq);
      const anonData = await anonRes.json();
      expect(anonData.payos.clientIdPrefix).toBe('');

      // Admin request via header -> returns prefix
      const adminReq = new Request('http://localhost:3000/api/health', {
        headers: { 'x-admin-secret': 'admin_vault_pass' },
      });
      const adminRes = await getHealth(adminReq);
      const adminData = await adminRes.json();
      expect(adminData.payos.clientIdPrefix).toBe('test...');

      // Admin request via cookie -> returns prefix
      const cookieReq = new Request('http://localhost:3000/api/health', {
        headers: { cookie: 'tc_admin_secret=admin_vault_pass' },
      });
      const cookieRes = await getHealth(cookieReq);
      const cookieData = await cookieRes.json();
      expect(cookieData.payos.clientIdPrefix).toBe('test...');
    });
  });
});
