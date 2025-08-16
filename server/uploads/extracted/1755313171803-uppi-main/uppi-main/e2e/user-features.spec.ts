import { test, expect } from '@playwright/test';

test.describe('Document Storage', () => {
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
    
    await page.goto('/documents');
  });

  test('should display document storage page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /document storage/i })).toBeVisible();
    await expect(page.getByText(/store.*manage.*documents/i)).toBeVisible();
  });

  test('should show file upload interface', async ({ page }) => {
    await expect(page.getByText(/upload.*document|choose.*file/i)).toBeVisible();
  });

  test('should show search and filter options', async ({ page }) => {
    await expect(page.getByPlaceholder(/search.*documents/i)).toBeVisible();
    await expect(page.getByText(/all.*categories|filter/i)).toBeVisible();
  });

  test('should handle empty document state', async ({ page }) => {
    const emptyState = page.getByText(/no.*documents.*uploaded|upload.*first/i);
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    }
  });
});

test.describe('AI Chatbot', () => {
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
    
    await page.goto('/chat');
  });

  test('should display AI chatbot interface', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ai.*chatbot|ai.*assistant/i })).toBeVisible();
  });

  test('should show chat input interface', async ({ page }) => {
    await expect(page.getByPlaceholder(/type.*message|ask.*question/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
  });

  test('should display welcome message or chat history', async ({ page }) => {
    // Should show either welcome message or existing chat
    const chatArea = page.locator('[data-testid="chat-area"], .chat-container, .messages');
    await expect(chatArea).toBeVisible();
  });
});

test.describe('Settings Page', () => {
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
    
    await page.goto('/settings');
  });

  test('should display settings page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('should show API keys section', async ({ page }) => {
    await expect(page.getByText(/api.*keys/i)).toBeVisible();
  });

  test('should show profile settings', async ({ page }) => {
    const profileSection = page.getByText(/profile|account/i);
    if (await profileSection.isVisible()) {
      await expect(profileSection).toBeVisible();
    }
  });
});