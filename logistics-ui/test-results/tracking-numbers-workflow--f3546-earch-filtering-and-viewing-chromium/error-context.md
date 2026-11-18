# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tracking-numbers-workflow.spec.ts >> Admin Tracking Numbers Management Workflow >> should execute full tracking number generation, search, filtering, and viewing
- Location: tests/e2e/tracking-numbers-workflow.spec.ts:4:3

# Error details

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('a[href="/admin/clients"]')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Admin Tracking Numbers Management Workflow', () => {
  4  |   test('should execute full tracking number generation, search, filtering, and viewing', async ({ page }) => {
  5  |     const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  6  |     const adminEmail = `admin-${uniqueId}@example.com`;
  7  |     const clientName = `TN Client ${uniqueId}`;
  8  | 
  9  |     // Setup: Register & Login Admin
  10 |     await page.goto('/admin/register');
  11 |     await page.getByPlaceholder('John').fill('Test');
  12 |     await page.getByPlaceholder('Doe').fill('Admin');
  13 |     await page.getByPlaceholder('admin@example.com').fill(adminEmail);
  14 |     await page.getByPlaceholder('••••••••').fill('secretPassword123');
  15 |     await page.getByRole('button', { name: 'Register Admin' }).click();
  16 | 
  17 |     await page.goto('/admin/login');
  18 |     await page.getByPlaceholder('Enter your email').fill(adminEmail);
  19 |     await page.getByPlaceholder('Enter your password').fill('secretPassword123');
  20 |     await page.getByRole('button', { name: 'Continue' }).click();
  21 | 
  22 |     // Setup: Create a client first so we have one to generate tracking numbers for
> 23 |     await page.locator('a[href="/admin/clients"]').click();
     |                                                    ^ Error: locator.click: Target page, context or browser has been closed
  24 |     await expect(page).toHaveURL('/admin/clients');
  25 | 
  26 |     await page.getByRole('button', { name: 'New Client' }).click();
  27 |     const createDialog = page.getByRole('dialog');
  28 |     await createDialog.getByPlaceholder('Laravel E-Commerce PH').fill(clientName);
  29 |     await createDialog.getByRole('button', { name: 'Register Client' }).click();
  30 |     await expect(page.getByText(/registered successfully/i).first()).toBeVisible();
  31 | 
  32 |     // Navigate to Tracking Numbers
  33 |     await page.locator('a[href="/admin/tracking-numbers"]').click();
  34 |     await expect(page).toHaveURL('/admin/tracking-numbers');
  35 | 
  36 |     // Test Pagination & Status Filter Dropdown
  37 |     await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  38 |     
  39 |     const statusSelect = page.locator('button[role="combobox"]').first();
  40 |     await statusSelect.click();
  41 |     await page.getByRole('option', { name: 'Unassigned', exact: true }).click();
  42 |     await expect(page.getByText('Clear Filter')).toBeVisible();
  43 | 
  44 |     await page.getByRole('button', { name: 'Clear Filter' }).click();
  45 | 
  46 |     // GENERATE: Open Generate Numbers Modal
  47 |     await page.getByRole('button', { name: 'Generate Numbers' }).click();
  48 |     const generateModalHeading = page.getByRole('heading', { name: 'Generate Tracking Numbers' });
  49 |     await expect(generateModalHeading).toBeVisible();
  50 | 
  51 |     const generateDialog = page.getByRole('dialog');
  52 |     
  53 |     // Select the newly created client in combobox
  54 |     const clientSelect = generateDialog.locator('button[role="combobox"]');
  55 |     await clientSelect.click();
  56 |     await page.getByRole('option', { name: clientName }).click();
  57 | 
  58 |     // Set pool size
  59 |     const sizeInput = generateDialog.locator('input[type="number"]');
  60 |     await sizeInput.clear();
  61 |     await sizeInput.fill('5');
  62 | 
  63 |     await generateDialog.getByRole('button', { name: 'Generate' }).click();
  64 | 
  65 |     // Assert generation success toast
  66 |     await expect(page.getByText(/generated successfully/i).first()).toBeVisible();
  67 | 
  68 |     // SEARCH: Use search bar to locate generated tracking numbers by client name
  69 |     const searchInput = page.getByPlaceholder('Search tracking number or client...');
  70 |     await searchInput.fill(clientName);
  71 |     await expect(page.getByText('Clear Filter')).toBeVisible();
  72 | 
  73 |     // Verify tracking number row appears in filtered table
  74 |     const trackingRow = page.locator('tr', { hasText: clientName }).first();
  75 |     await expect(trackingRow).toBeVisible();
  76 | 
  77 |     // VIEW DETAILS: Click 1st action button (Eye icon) to inspect tracking number details
  78 |     await trackingRow.locator('button').nth(0).click();
  79 | 
  80 |     const viewModalHeading = page.getByRole('heading', { name: 'Tracking Number Details' });
  81 |     await expect(viewModalHeading).toBeVisible();
  82 |     await page.getByRole('button', { name: 'Close' }).click();
  83 | 
  84 |     // RESET VIEW: Clear search filter to restore full list
  85 |     await searchInput.clear();
  86 |     await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  87 |   });
  88 | });
```