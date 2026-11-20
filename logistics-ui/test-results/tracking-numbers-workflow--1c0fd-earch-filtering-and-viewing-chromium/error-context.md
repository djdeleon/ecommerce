# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tracking-numbers-workflow.spec.ts >> Admin Tracking Numbers Management Workflow >> should execute full tracking number generation, pagination, search, filtering, and viewing
- Location: tests/e2e/tracking-numbers-workflow.spec.ts:4:3

# Error details

```
Error: locator.fill: Target page, context or browser has been closed
Call log:
  - waiting for getByPlaceholder('John')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Admin Tracking Numbers Management Workflow', () => {
  4  |   test('should execute full tracking number generation, pagination, search, filtering, and viewing', async ({ page }) => {
  5  |     const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  6  |     const adminEmail = `admin-${uniqueId}@example.com`;
  7  |     const clientName = `TN Client ${uniqueId}`;
  8  | 
  9  |     // Setup: Register & Login Admin
  10 |     await page.goto('/admin/register');
> 11 |     await page.getByPlaceholder('John').fill('Test');
     |                                         ^ Error: locator.fill: Target page, context or browser has been closed
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
  23 |     await page.locator('a[href="/admin/clients"]').click();
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
  36 |     // Test Status Filter Dropdown & Clear Filter
  37 |     const statusSelect = page.locator('button[role="combobox"]').first();
  38 |     await statusSelect.click();
  39 |     await page.getByRole('option', { name: 'Unassigned', exact: true }).click();
  40 |     await expect(page.getByText('Clear Filter')).toBeVisible();
  41 | 
  42 |     await page.getByRole('button', { name: 'Clear Filter' }).click();
  43 | 
  44 |     // GENERATE: Open Generate Numbers Modal & generate 15 records to trigger pagination
  45 |     await page.getByRole('button', { name: 'Generate Numbers' }).click();
  46 |     const generateModalHeading = page.getByRole('heading', { name: 'Generate Tracking Numbers' });
  47 |     await expect(generateModalHeading).toBeVisible();
  48 | 
  49 |     const generateDialog = page.getByRole('dialog');
  50 | 
  51 |     // Select the newly created client in combobox
  52 |     const clientSelect = generateDialog.locator('button[role="combobox"]');
  53 |     await clientSelect.click();
  54 |     await page.getByRole('option', { name: clientName }).click();
  55 | 
  56 |     // Set pool size to 15 (exceeds default page size of 10)
  57 |     const sizeInput = generateDialog.locator('input[type="number"]');
  58 |     await sizeInput.clear();
  59 |     await sizeInput.fill('15');
  60 | 
  61 |     await generateDialog.getByRole('button', { name: 'Generate' }).click();
  62 | 
  63 |     // Assert generation success toast
  64 |     await expect(page.getByText(/generated successfully/i).first()).toBeVisible();
  65 | 
  66 |     // PAGINATION: Verify pagination is visible and navigate if multiple pages exist
  67 |     await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  68 | 
  69 |     const pageTwo = page.getByRole('button', { name: 'Page 2' });
  70 |     if (await pageTwo.isVisible()) {
  71 |       await pageTwo.click();
  72 |       await expect(page.getByText(/Showing page 2 of/)).toBeVisible();
  73 | 
  74 |       await page.getByRole('button', { name: 'Page 1' }).click();
  75 |       await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  76 |     }
  77 | 
  78 |     // SEARCH: Use search bar to locate generated tracking numbers by client name
  79 |     const searchInput = page.getByPlaceholder('Search tracking number or client...');
  80 |     await searchInput.fill(clientName);
  81 |     await expect(page.getByText('Clear Filter')).toBeVisible();
  82 | 
  83 |     // Verify tracking number row appears in filtered table
  84 |     const trackingRow = page.locator('tr', { hasText: clientName }).first();
  85 |     await expect(trackingRow).toBeVisible();
  86 | 
  87 |     // VIEW DETAILS: Click 1st action button (Eye icon) to inspect tracking number details
  88 |     await trackingRow.locator('button').nth(0).click();
  89 | 
  90 |     const viewModalHeading = page.getByRole('heading', { name: 'Tracking Number Details' });
  91 |     await expect(viewModalHeading).toBeVisible();
  92 |     await page.getByRole('button', { name: 'Close' }).click();
  93 | 
  94 |     // RESET VIEW: Clear search filter to restore full list
  95 |     await searchInput.clear();
  96 |     await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  97 |   });
  98 | });
```