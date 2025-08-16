import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Should redirect to login page
    await expect(page).toHaveURL(/.*\/auth\/login/);
    
    // Should show login form
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show validation (HTML5 validation will prevent submission)
    const emailInput = page.getByPlaceholder(/email/i);
    await expect(emailInput).toHaveAttribute('required');
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Click signup link
    await page.getByRole('link', { name: /sign up/i }).click();
    
    // Should be on signup page
    await expect(page).toHaveURL(/.*\/auth\/signup/);
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
  });

  test('should show forgot password option', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Should have forgot password link
    await expect(page.getByRole('link', { name: /forgot.*password/i })).toBeVisible();
  });
});

test.describe('Authenticated User Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful authentication
    await page.addInitScript(() => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: { role: 'user' }
        }
      }));
    });
  });

  test('should display dashboard after login', async ({ page }) => {
    await page.goto('/');
    
    // Should show dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    
    // Should show stats cards
    await expect(page.getByText(/total analyses/i)).toBeVisible();
    await expect(page.getByText(/api keys/i)).toBeVisible();
    await expect(page.getByText(/system health/i)).toBeVisible();
  });

  test('should navigate through main sections', async ({ page }) => {
    await page.goto('/');
    
    // Test Market Research navigation
    await page.getByRole('link', { name: /market research/i }).click();
    await expect(page).toHaveURL(/.*\/market-research/);
    await expect(page.getByRole('heading', { name: /market research/i })).toBeVisible();
    
    // Test Competitor Analysis navigation
    await page.getByRole('link', { name: /competitor analysis/i }).click();
    await expect(page).toHaveURL(/.*\/competitor-analysis/);
    await expect(page.getByRole('heading', { name: /competitor analysis/i })).toBeVisible();
    
    // Test Business Plan navigation
    await page.getByRole('link', { name: /business plan/i }).click();
    await expect(page).toHaveURL(/.*\/business-plan/);
    await expect(page.getByRole('heading', { name: /business plan/i })).toBeVisible();
    
    // Test Resources navigation
    await page.getByRole('link', { name: /resources/i }).click();
    await expect(page).toHaveURL(/.*\/resources/);
    await expect(page.getByRole('heading', { name: /resources/i })).toBeVisible();
  });

  test('should access user menu features', async ({ page }) => {
    await page.goto('/');
    
    // Click user menu
    await page.getByRole('button', { name: /user menu/i }).click();
    
    // Should show user menu options
    await expect(page.getByRole('menuitem', { name: /ai chatbot/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /documents/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /api keys/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /settings/i })).toBeVisible();
    
    // Test navigation to AI Chatbot
    await page.getByRole('menuitem', { name: /ai chatbot/i }).click();
    await expect(page).toHaveURL(/.*\/chat/);
  });
});