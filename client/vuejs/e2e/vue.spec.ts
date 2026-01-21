import { test, expect } from '@playwright/test';

// Note: These tests require the backend to be running on port 5000
// Run: cd server/dotnet-minimal && dotnet run

test.describe('Wikipedia Text Formatter', () => {
  test('shows the page title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Telenor test');
  });

  test('format button is disabled initially', async ({ page }) => {
    await page.goto('/');
    const formatButton = page.getByRole('button', { name: /format text/i });
    await expect(formatButton).toBeDisabled();
  });

  test('loads Wikipedia data from API', async ({ page }) => {
    await page.goto('/');

    // Wait for the section with data to appear
    const section = page.locator('section');
    await expect(section).toBeVisible({ timeout: 10000 });

    // Check that title is displayed
    const title = section.locator('h2');
    await expect(title).toBeVisible();

    // Check that text content is loaded
    const textContent = page.locator('p[style*="line-height"]');
    await expect(textContent).toBeVisible();
    await expect(textContent).not.toBeEmpty();
  });

  test('selecting text enables the format button', async ({ page }) => {
    await page.goto('/');

    // Wait for content to load
    const textContent = page.locator('p[style*="line-height"]');
    await expect(textContent).toBeVisible({ timeout: 10000 });

    // Select some text using JavaScript
    await page.evaluate(() => {
      const p = document.querySelector('p[style*="line-height"]');
      if (p && p.firstChild) {
        const range = document.createRange();
        const textNode = p.firstChild;
        range.setStart(textNode, 0);
        range.setEnd(textNode, Math.min(10, textNode.textContent?.length || 0));
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });

    // Wait for selection to be registered
    await page.waitForTimeout(100);

    // Format button should now be enabled
    const formatButton = page.getByRole('button', { name: /format text/i });
    await expect(formatButton).toBeEnabled();

    // Should show selected text indicator
    await expect(page.locator('text=Selected:')).toBeVisible();
  });

  test('clicking format button applies formatting with background color', async ({ page }) => {
    await page.goto('/');

    // Wait for content to load
    const textContent = page.locator('p[style*="line-height"]');
    await expect(textContent).toBeVisible({ timeout: 10000 });

    // Select some text
    await page.evaluate(() => {
      const p = document.querySelector('p[style*="line-height"]');
      if (p && p.firstChild) {
        const range = document.createRange();
        const textNode = p.firstChild;
        range.setStart(textNode, 0);
        range.setEnd(textNode, Math.min(10, textNode.textContent?.length || 0));
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });

    await page.waitForTimeout(100);

    // Click format button
    const formatButton = page.getByRole('button', { name: /format text/i });
    await formatButton.click();

    // Wait for formatting to complete
    await page.waitForTimeout(500);

    // Check that a span with background-color style was added
    const formattedSpan = textContent.locator('span[style*="background-color"]');
    await expect(formattedSpan).toBeVisible();
  });

  test('formatting capitalizes first letter of each word', async ({ page }) => {
    await page.goto('/');

    // Wait for content to load
    const textContent = page.locator('p[style*="line-height"]');
    await expect(textContent).toBeVisible({ timeout: 10000 });

    // Get the first few words of text and select them
    const selectedText = await page.evaluate(() => {
      const p = document.querySelector('p[style*="line-height"]');
      if (p && p.firstChild) {
        const text = p.firstChild.textContent || '';
        // Get first 20 characters
        const toSelect = text.substring(0, 20);

        const range = document.createRange();
        const textNode = p.firstChild;
        range.setStart(textNode, 0);
        range.setEnd(textNode, 20);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        return toSelect;
      }
      return '';
    });

    await page.waitForTimeout(100);

    // Click format button
    await page.getByRole('button', { name: /format text/i }).click();
    await page.waitForTimeout(500);

    // Get the formatted text
    const formattedSpan = textContent.locator('span[style*="background-color"]').first();
    const formattedText = await formattedSpan.textContent();

    // Verify that first letter of each word is capitalized
    const words = formattedText?.split(' ') || [];
    for (const word of words) {
      if (word.length > 0) {
        expect(word[0]).toBe(word[0].toUpperCase());
      }
    }
  });

  test('can format multiple selections with different colors', async ({ page }) => {
    await page.goto('/');

    // Wait for content to load
    const textContent = page.locator('p[style*="line-height"]');
    await expect(textContent).toBeVisible({ timeout: 10000 });

    // First selection and format
    await page.evaluate(() => {
      const p = document.querySelector('p[style*="line-height"]');
      if (p && p.firstChild) {
        const range = document.createRange();
        const textNode = p.firstChild;
        range.setStart(textNode, 0);
        range.setEnd(textNode, Math.min(5, textNode.textContent?.length || 0));
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });

    await page.waitForTimeout(100);
    await page.getByRole('button', { name: /format text/i }).click();
    await page.waitForTimeout(500);

    // Second selection and format (different text)
    await page.evaluate(() => {
      const p = document.querySelector('p[style*="line-height"]');
      if (p) {
        // Find the last text node (unformatted text)
        const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        let lastTextNode = null;
        while (walker.nextNode()) {
          if (walker.currentNode.textContent && walker.currentNode.textContent.trim().length > 10) {
            lastTextNode = walker.currentNode;
          }
        }
        if (lastTextNode) {
          const range = document.createRange();
          range.setStart(lastTextNode, 0);
          range.setEnd(lastTextNode, Math.min(5, lastTextNode.textContent?.length || 0));
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    });

    await page.waitForTimeout(100);
    await page.getByRole('button', { name: /format text/i }).click();
    await page.waitForTimeout(500);

    // Should have at least 2 formatted spans (style may be normalized by browser)
    const formattedSpans = textContent.locator('span[style*="background"]');
    const count = await formattedSpans.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('shows error when API is unavailable', async ({ page }) => {
    // Block API requests
    await page.route('**/wikipedia', (route) => route.abort());

    await page.goto('/');

    // Should show error message
    const error = page.locator('p[style*="color: red"]');
    await expect(error).toBeVisible({ timeout: 10000 });
  });

  test('can select and format all text after previous formatting', async ({ page }) => {
    await page.goto('/');

    // Wait for content to load
    const textContent = page.locator('p[style*="line-height"]');
    await expect(textContent).toBeVisible({ timeout: 10000 });

    // First: format a small portion of text
    await page.evaluate(() => {
      const p = document.querySelector('p[style*="line-height"]');
      if (p && p.firstChild) {
        const range = document.createRange();
        const textNode = p.firstChild;
        range.setStart(textNode, 0);
        range.setEnd(textNode, Math.min(10, textNode.textContent?.length || 0));
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });

    await page.waitForTimeout(100);
    await page.getByRole('button', { name: /format text/i }).click();
    await page.waitForTimeout(500);

    // Verify first format worked
    let spanCount = await textContent.locator('span[style*="background"]').count();
    expect(spanCount).toBeGreaterThanOrEqual(1);

    // Now select ALL text in the paragraph (including formatted parts)
    await page.evaluate(() => {
      const p = document.querySelector('p[style*="line-height"]');
      if (p) {
        const range = document.createRange();
        range.selectNodeContents(p);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });

    await page.waitForTimeout(100);

    // Format button should be enabled
    const formatButton = page.getByRole('button', { name: /format text/i });
    await expect(formatButton).toBeEnabled();

    // Click format to wrap all text
    await formatButton.click();
    await page.waitForTimeout(500);

    // Should have formatted spans (the entire selection gets formatted)
    const formattedSpans = textContent.locator('span[style*="background"]');
    const finalCount = await formattedSpans.count();
    expect(finalCount).toBeGreaterThanOrEqual(1);
  });

  test('can format already formatted text (re-format)', async ({ page }) => {
    await page.goto('/');

    // Wait for content to load
    const textContent = page.locator('p[style*="line-height"]');
    await expect(textContent).toBeVisible({ timeout: 10000 });

    // First: format some text
    await page.evaluate(() => {
      const p = document.querySelector('p[style*="line-height"]');
      if (p && p.firstChild) {
        const range = document.createRange();
        const textNode = p.firstChild;
        range.setStart(textNode, 0);
        range.setEnd(textNode, Math.min(20, textNode.textContent?.length || 0));
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });

    await page.waitForTimeout(100);
    await page.getByRole('button', { name: /format text/i }).click();
    await page.waitForTimeout(500);

    // Get the color of the first format
    const firstSpan = textContent.locator('span[style*="background"]').first();
    const firstColor = await firstSpan.evaluate((el) => el.style.color);

    // Now select text INSIDE the formatted span and format again
    await page.evaluate(() => {
      const span = document.querySelector('p[style*="line-height"] span[style*="background"]');
      if (span && span.firstChild) {
        const range = document.createRange();
        const textNode = span.firstChild;
        range.setStart(textNode, 0);
        range.setEnd(textNode, Math.min(5, textNode.textContent?.length || 0));
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });

    await page.waitForTimeout(100);
    await page.getByRole('button', { name: /format text/i }).click();
    await page.waitForTimeout(500);

    // Should now have nested spans
    const nestedSpan = textContent.locator('span[style*="background"] span[style*="background"]');
    await expect(nestedSpan).toBeVisible();
  });
});
