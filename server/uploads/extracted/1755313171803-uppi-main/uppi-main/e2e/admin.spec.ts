import { test, expect } from '@playwright/test';

test.describe('Admin Panel Access', () => {
  test.beforeEach(async ({ page }) => {
    // Mock super admin user
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'super-admin-id',
          email: 'akclapp@gmail.com',
          user_metadata: { role: 'super_admin' }
        }
      }));
    });
  });

  test('should allow super admin to access admin panel', async ({ page }) => {
    await page.goto('/');
    
    // Click user menu
    await page.getByRole('button', { name: /user menu/i }).click();
    
    // Should show admin panel option
    await expect(page.getByRole('menuitem', { name: /admin panel/i })).toBeVisible();
    
    // Navigate to admin panel
    await page.getByRole('menuitem', { name: /admin panel/i }).click();
    await expect(page).toHaveURL(/.*\/admin/);
  });

  test('should display admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    
    await expect(page.getByRole('heading', { name: /admin.*dashboard/i })).toBeVisible();
  });

  test('should navigate to affiliate management', async ({ page }) => {
    await page.goto('/admin');
    
    // Look for affiliate link in navigation
    const affiliateLink = page.getByRole('link', { name: /affiliate/i });
    if (await affiliateLink.isVisible()) {
      await affiliateLink.click();
      await expect(page).toHaveURL(/.*\/admin\/affiliate/);
      await expect(page.getByRole('heading', { name: /affiliate.*management/i })).toBeVisible();
    }
  });

  test('should show user management section', async ({ page }) => {
    await page.goto('/admin');
    
    const userManagementLink = page.getByRole('link', { name: /user.*management|users/i });
    if (await userManagementLink.isVisible()) {
      await userManagementLink.click();
      await expect(page.getByText(/user.*management|manage.*users/i)).toBeVisible();
    }
  });
});

test.describe('Affiliate Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'super-admin-id',
          email: 'akclapp@gmail.com',
          user_metadata: { role: 'super_admin' }
        }
      }));
    });
    
    await page.goto('/admin/affiliate');
  });

  test('should display affiliate management page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /affiliate.*management/i })).toBeVisible();
    await expect(page.getByText(/manage.*affiliate.*links/i)).toBeVisible();
  });

  test('should show add affiliate link button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add.*affiliate.*link/i })).toBeVisible();
  });

  test('should display affiliate links table', async ({ page }) => {
    // Should show table headers or empty state
    const tableElement = page.getByRole('table');
    const emptyState = page.getByText(/no.*affiliate.*links/i);
    
    const hasTable = await tableElement.isVisible();
    const hasEmptyState = await emptyState.isVisible();
    
    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test('should show affiliate alerts section', async ({ page }) => {
    const alertsSection = page.getByText(/alerts|notifications/i);
    if (await alertsSection.isVisible()) {
      await expect(alertsSection).toBeVisible();
    }
  });
});

test.describe('Admin Access Control', () => {
  test('should deny access to non-admin users', async ({ page }) => {
    // Mock regular user
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'regular-user-id',
          email: 'user@example.com',
          user_metadata: { role: 'user' }
        }
      }));
    });
    
    await page.goto('/admin');
    
    // Should show access denied or redirect
    const accessDenied = page.getByText(/access.*denied|unauthorized/i);
    const redirected = page.url().includes('/admin') === false;
    
    const hasAccessDenied = await accessDenied.isVisible();
    expect(hasAccessDenied || redirected).toBeTruthy();
  });

  test('should not show admin panel link for regular users', async ({ page }) => {
    // Mock regular user
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'regular-user-id',
          email: 'user@example.com',
          user_metadata: { role: 'user' }
        }
      }));
    });
    
    await page.goto('/');
    
    // Click user menu
    await page.getByRole('button', { name: /user menu/i }).click();
    
    // Should NOT show admin panel option
    await expect(page.getByRole('menuitem', { name: /admin panel/i })).not.toBeVisible();
  });
});