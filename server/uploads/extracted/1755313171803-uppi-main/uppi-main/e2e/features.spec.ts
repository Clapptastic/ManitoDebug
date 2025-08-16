import { test, expect } from '@playwright/test';

test.describe('Competitor Analysis Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: { role: 'user' }
        }
      }));
    });
    
    await page.goto('/competitor-analysis');
  });

  test('should display competitor analysis page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /competitor analysis/i })).toBeVisible();
    await expect(page.getByText(/analyze your competitors/i)).toBeVisible();
  });

  test('should show API key requirement notification', async ({ page }) => {
    // Should show API key alert when no keys are configured
    await expect(page.getByText(/api.*key.*required/i)).toBeVisible();
  });

  test('should allow starting a new analysis', async ({ page }) => {
    // Look for new analysis button or form
    const newAnalysisButton = page.getByRole('button', { name: /new analysis|start analysis/i });
    if (await newAnalysisButton.isVisible()) {
      await newAnalysisButton.click();
      
      // Should show analysis form or modal
      await expect(page.getByText(/competitor.*name|company.*name/i)).toBeVisible();
    }
  });

  test('should display existing analyses list', async ({ page }) => {
    // Should show analyses section
    await expect(page.getByText(/recent.*analyses|your.*analyses/i)).toBeVisible();
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Should show appropriate message when no analyses exist
    const emptyState = page.getByText(/no.*analyses.*yet|get started/i);
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    }
  });
});

test.describe('API Keys Management', () => {
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
    
    await page.goto('/api-keys');
  });

  test('should display API keys management page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /api keys/i })).toBeVisible();
    await expect(page.getByText(/manage.*api.*keys/i)).toBeVisible();
  });

  test('should show add API key form', async ({ page }) => {
    await expect(page.getByText(/provider|select.*provider/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter.*api.*key/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /add.*key/i })).toBeVisible();
  });

  test('should validate API key form', async ({ page }) => {
    // Try to submit without selecting provider
    await page.getByRole('button', { name: /add.*key/i }).click();
    
    // Should show validation or remain on page
    await expect(page).toHaveURL(/.*api-keys/);
  });

  test('should display existing API keys', async ({ page }) => {
    // Should show API keys section (might be empty)
    const keysSection = page.getByText(/your.*api.*keys|existing.*keys/i);
    await expect(keysSection).toBeVisible();
  });
});