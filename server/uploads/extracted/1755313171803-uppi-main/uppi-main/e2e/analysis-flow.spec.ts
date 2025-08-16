import { test, expect } from '@playwright/test';

// Supabase Edge Functions base URL for this project
const FN_BASE = 'https://jqbdjttdaihidoyalqvs.supabase.co/functions/v1';

/**
 * E2E Smoke for Competitor Analysis pipeline resiliency
 * - Health endpoints respond with 200 JSON
 * - Primary and proxy functions return structured 200 responses even unauthenticated
 */
 test.describe('Competitor Analysis Pipeline - Resiliency Smoke', () => {
  test('health: competitor-analysis + comprehensive + check-api-keys', async ({ request }) => {
    const endpoints = [
      `${FN_BASE}/competitor-analysis?health=1`,
      `${FN_BASE}/comprehensive-competitor-analysis?health=1`,
      `${FN_BASE}/check-api-keys?health=1`,
    ];

    for (const url of endpoints) {
      const res = await request.get(url);
      expect(res.status(), `GET ${url} should be 200`).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({ success: true });
    }
  });

  test('validate-api-key: POST healthCheck returns 200 JSON', async ({ request }) => {
    const res = await request.post(`${FN_BASE}/validate-api-key`, {
      data: { healthCheck: true },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('isValid');
  });

  test('competitor-analysis: returns structured 200 even unauthenticated', async ({ request }) => {
    const res = await request.post(`${FN_BASE}/competitor-analysis`, {
      data: { action: 'start', competitors: ['TestCo Inc'] },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // success may be false without auth, but response must be structured
    expect(body).toHaveProperty('success');
    expect(body).toHaveProperty('error');
  });

  test('comprehensive-competitor-analysis: returns structured 200 even without auth', async ({ request }) => {
    const res = await request.post(`${FN_BASE}/comprehensive-competitor-analysis`, {
      data: { action: 'start', competitors: ['TestCo Inc'] },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('success');
    // Either results or error will be present
    expect(Object.keys(body)).toEqual(expect.arrayContaining(['success']));
  });
});
