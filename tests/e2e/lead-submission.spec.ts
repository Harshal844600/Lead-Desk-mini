import { test, expect } from '@playwright/test';

test.describe('Lead Submission Flow', () => {
  test('should successfully submit a lead when all fields are valid', async ({ page }) => {
    await page.goto('/');

    // Fill out the form
    await page.fill('input[name="name"]', 'Test E2E User');
    await page.fill('input[name="email"]', 'test.e2e@example.com');
    await page.selectOption('select[name="budget"]', '$5k-$25k');
    await page.fill('textarea[name="message"]', 'This is an automated E2E test message.');

    // In a real environment with Turnstile, we'd need to either:
    // 1. Provide a dummy token via intercepting the API request
    // 2. Click the "Turnstile" widget (if it's in testing mode)
    // For this demonstration, we'll intercept the API request to bypass external captchas during E2E.
    
    await page.route('/api/public/leads', async route => {
      // Mock the successful backend response
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, id: 'test-id-123', created_at: new Date().toISOString() }),
      });
    });

    await page.click('button[type="submit"]');

    // Wait for the success state
    const successHeader = page.locator('h3:has-text("Message received")');
    await expect(successHeader).toBeVisible();
    
    const successText = page.locator('text=We\'ve logged your inquiry and someone will reach out shortly.');
    await expect(successText).toBeVisible();
  });
});
