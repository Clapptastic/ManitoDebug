import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      }));
    });
  });

  test('should display mobile navigation', async ({ page }) => {
    await page.goto('/');
    
    // Should show mobile menu button
    const menuButton = page.getByRole('button', { name: /menu/i });
    await expect(menuButton).toBeVisible();
  });

  test('should open mobile menu', async ({ page }) => {
    await page.goto('/');
    
    // Click mobile menu button
    const menuButton = page.getByRole('button', { name: /menu/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Should show navigation items
      await expect(page.getByRole('link', { name: /market research/i })).toBeVisible();
    }
  });

  test('should display dashboard cards in mobile layout', async ({ page }) => {
    await page.goto('/');
    
    // Dashboard cards should be visible and properly laid out
    await expect(page.getByText(/total analyses/i)).toBeVisible();
    await expect(page.getByText(/api keys/i)).toBeVisible();
  });
});

test.describe('Cross-Browser Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      }));
    });
  });

  test('should load application properly', async ({ page }) => {
    await page.goto('/');
    
    // Basic functionality should work across browsers
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByText(/ai.*entrepreneur/i)).toBeVisible();
  });

  test('should handle navigation properly', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation works in all browsers
    await page.getByRole('link', { name: /competitor analysis/i }).click();
    await expect(page).toHaveURL(/.*competitor-analysis/);
  });
});

test.describe('Performance and Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      }));
    });
  });

  test('should load main pages within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds (adjust as needed)
    expect(loadTime).toBeLessThan(3000);
    
    // Should show content
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should handle loading states gracefully', async ({ page }) => {
    await page.goto('/competitor-analysis');
    
    // Should show either content or loading state
    const content = page.getByRole('heading', { name: /competitor analysis/i });
    const loading = page.getByText(/loading/i);
    
    const hasContent = await content.isVisible();
    const hasLoading = await loading.isVisible();
    
    expect(hasContent || hasLoading).toBeTruthy();
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should show 404 page or redirect
    const notFound = page.getByText(/not found|404/i);
    const redirected = !page.url().includes('non-existent-page');
    
    const hasNotFound = await notFound.isVisible();
    expect(hasNotFound || redirected).toBeTruthy();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/**', route => route.abort());
    
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      }));
    });
    
    await page.goto('/');
    
    // Should still render the page structure
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });
});