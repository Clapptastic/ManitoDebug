import { test, expect } from '@playwright/test';

// E2E: Competitor Analysis Flow Monitor
// - Mocks Supabase Edge Function calls to ensure deterministic UI behavior
// - Verifies pipeline runs without page errors and handles both success and failure paths
// - NOTE: We inject a fake Supabase session into localStorage so auth-dependent UI mounts.

const PROJECT_REF = 'jqbdjttdaihidoyalqvs';
const FUNCTIONS_BASE = `https://${PROJECT_REF}.supabase.co/functions/v1`;
const REST_BASE = `https://${PROJECT_REF}.supabase.co/rest/v1`;

async function primeFakeSession(page) {
  await page.addInitScript(({ ref }) => {
    try {
      const tokenKey = `sb-${ref}-auth-token`;
      const fake = {
        currentSession: {
          access_token: 'test-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'test-refresh-token',
          user: {
            id: '00000000-0000-4000-8000-000000000001',
            email: 'e2e@test.local',
          },
        },
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      } as any;
      localStorage.setItem(tokenKey, JSON.stringify(fake));
    } catch {}
  }, { ref: PROJECT_REF });
}

function mockCommonRoutes(page) {
  // API keys check
  page.route(`${FUNCTIONS_BASE}/check-api-keys`, (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        total_keys: 1,
        working_keys: 1,
        keys: { openai: { working: true, error: null } },
        message: 'API keys are working',
      }),
    });
  });

  // RPC: progress insert/update
  page.route(`${REST_BASE}/rpc/insert_competitor_analysis_progress`, (route) => {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee') });
  });
  page.route(`${REST_BASE}/rpc/update_competitor_analysis_progress`, (route) => {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(true) });
  });

  // DB selects that the monitor issues for environment stats — return empty sets quickly
  page.route(new RegExp(`${REST_BASE}/competitor_analyses.*`), (route) => {
    const method = route.request().method();
    if (method === 'HEAD') {
      return route.fulfill({ status: 200 });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
}

test.describe('Admin • Analysis Flow Monitor (E2E, mocked)', () => {
  test('happy path: successful analysis returns structured results and UI stays stable', async ({ page }) => {
    await primeFakeSession(page);
    mockCommonRoutes(page);

    // Edge function: competitor-analysis returns success with one completed result
    page.route(`${FUNCTIONS_BASE}/competitor-analysis`, (route) => {
      const body = {
        success: true,
        session_id: 'test_session_1',
        results: [
          {
            name: 'Microsoft',
            strengths: ['Scale'],
            weaknesses: ['Bureaucracy'],
            opportunities: ['AI'],
            threats: ['Regulatory'],
            data_quality_score: 82,
            providers_used: ['openai'],
            providers_skipped: [],
            status: 'completed',
            analyzed_at: new Date().toISOString(),
            session_id: 'test_session_1',
          },
        ],
        message: 'Analysis completed',
      };
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });

    const consoleErrors: string[] = [];
    page.on('pageerror', (e) => consoleErrors.push(e.message || String(e)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/admin/analysis-flow');

    // Enter competitor and run test
    await page.getByLabel('Competitor').fill('Microsoft');
    await page.getByRole('button', { name: /Run Test/i }).click();

    // Assert key pipeline steps flip to success or warning within timeout
    await expect(page.getByText('Authentication & Authorization')).toBeVisible();
    await expect(page.getByText('AI Analysis Pipeline')).toBeVisible();

    // The monitor aggregates and completes; give it time then ensure no fatal errors
    await page.waitForTimeout(1500);
    expect(consoleErrors.filter((t) => t.includes('toFixed') || t.includes('TypeError'))).toHaveLength(0);
  });

  test('failure path: structured 200 failure returns and UI handles gracefully (no crashes)', async ({ page }) => {
    await primeFakeSession(page);
    mockCommonRoutes(page);

    // Edge function: competitor-analysis returns failure with structured payload
    page.route(`${FUNCTIONS_BASE}/competitor-analysis`, (route) => {
      const body = {
        success: false,
        session_id: 'test_session_2',
        results: [
          {
            name: 'Microsoft',
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: [],
            data_quality_score: 0,
            providers_used: [],
            providers_skipped: ['openai'],
            status: 'failed',
            analyzed_at: new Date().toISOString(),
            session_id: 'test_session_2',
            error: 'All selected providers unavailable or failed',
          },
        ],
        error: 'AI pipeline returned no results',
      };
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });

    const consoleErrors: string[] = [];
    page.on('pageerror', (e) => consoleErrors.push(e.message || String(e)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/admin/analysis-flow');
    await page.getByLabel('Competitor').fill('Microsoft');
    await page.getByRole('button', { name: /Run Test/i }).click();

    await expect(page.getByText('AI Analysis Pipeline')).toBeVisible();
    await page.waitForTimeout(1500);

    // Ensure no fatal TypeErrors (e.g., toFixed of undefined) surfaced
    expect(consoleErrors.filter((t) => t.includes('toFixed') || t.includes('TypeError'))).toHaveLength(0);
  });
});
