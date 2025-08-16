import { test, expect } from '@playwright/test';

// E2E smoke test for /admin/master-profiles routing
// Note: This route is admin-guarded. Depending on auth state, we assert one of the expected UIs.

test.describe('Admin Master Profiles route', () => {
  test('loads route and shows either dashboard, access denied, or login', async ({ page }) => {
    await page.goto('/admin/master-profiles');

    // Accept any of these states to avoid auth coupling in CI
    const possibleSelectors = [
      'h1:has-text("Master Profile Management")',
      'h1:has-text("Master Profile Dashboard")',
      'text=Access Denied',
      'text=Sign in',
      'text=Login'
    ];

    const found = await Promise.any(
      possibleSelectors.map(async (sel) => {
        try {
          await page.waitForSelector(sel, { timeout: 5000 });
          return true;
        } catch {
          return false;
        }
      })
    ).catch(() => false);

    expect(found, 'Expected one of the known UIs to be visible').toBeTruthy();
  });
});
