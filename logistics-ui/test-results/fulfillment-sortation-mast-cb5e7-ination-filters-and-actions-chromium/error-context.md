# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fulfillment-sortation/master-bags-workflow.spec.ts >> Master Bags Management Workflow >> should execute full master bag workflow including pagination, filters, and actions
- Location: tests/e2e/fulfillment-sortation/master-bags-workflow.spec.ts:4:3

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
  3  | test.describe('Master Bags Management Workflow', () => {
  4  |   test('should execute full master bag workflow including pagination, filters, and actions', async ({ page }) => {
  5  |     const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  6  |     const adminEmail = `admin-${uniqueId}@example.com`;
  7  | 
  8  |     // Setup: Register & Login Admin
  9  |     await page.goto('/admin/register');
> 10 |     await page.getByPlaceholder('John').fill('Test');
     |                                         ^ Error: locator.fill: Target page, context or browser has been closed
  11 |     await page.getByPlaceholder('Doe').fill('Admin');
  12 |     await page.getByPlaceholder('admin@example.com').fill(adminEmail);
  13 |     await page.getByPlaceholder('••••••••').fill('secretPassword123');
  14 |     await page.getByRole('button', { name: 'Register Admin' }).click();
  15 | 
  16 |     await page.goto('/admin/login');
  17 |     await page.getByPlaceholder('Enter your email').fill(adminEmail);
  18 |     await page.getByPlaceholder('Enter your password').fill('secretPassword123');
  19 |     await page.getByRole('button', { name: 'Continue' }).click();
  20 | 
  21 |     // Navigate to Master Bags
  22 |     await page.locator('a[href="/admin/fulfillment-sortation/master-bags"]').click();
  23 |     await expect(page).toHaveURL('/admin/fulfillment-sortation/master-bags');
  24 | 
  25 |     // Test Pagination
  26 |     await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  27 |     const pageTwo = page.getByRole('button', { name: 'Page 2' });
  28 |     if (await pageTwo.isVisible()) {
  29 |       await pageTwo.click();
  30 |       await expect(page.getByText(/Showing page 2 of/)).toBeVisible();
  31 |       await page.getByRole('button', { name: 'Page 1' }).click();
  32 |       await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  33 |     }
  34 | 
  35 |     // Test Status Filter Dropdown & Clear Filter
  36 |     const statusSelect = page.getByRole('combobox', { name: /Filter by Status/i }).or(page.locator('button').filter({ hasText: 'Filter by Status' }));
  37 |     await statusSelect.click();
  38 |     await page.getByRole('option', { name: 'Open', exact: true }).click();
  39 |     await expect(page.getByText('Clear Filter')).toBeVisible();
  40 | 
  41 |     await page.getByRole('button', { name: 'Clear Filter' }).click();
  42 | 
  43 |     // Grab a master bag code from the table to interact with it
  44 |     const firstRow = page.locator('tbody tr').first();
  45 |     const bagCode = await firstRow.locator('td').nth(1).textContent();
  46 |     expect(bagCode).toBeTruthy();
  47 | 
  48 |     // SEARCH: Use search bar to locate the master bag instantly
  49 |     const searchInput = page.getByPlaceholder('Search master bag code...');
  50 |     await searchInput.fill(bagCode!);
  51 |     await expect(page.getByText('Clear Filter')).toBeVisible();
  52 | 
  53 |     // Verify master bag appears in filtered table
  54 |     await expect(page.getByText(bagCode!)).toBeVisible();
  55 | 
  56 |     // VIEW DETAILS: Click View Details button (Eye icon)
  57 |     const bagRow = page.locator('tr', { hasText: bagCode! });
  58 |     await bagRow.locator('button[title="View Details"]').click();
  59 | 
  60 |     const viewModalHeading = page.getByRole('heading', { name: 'Master Bag Details' });
  61 |     await expect(viewModalHeading).toBeVisible();
  62 |     await page.getByRole('button', { name: 'Close' }).click();
  63 | 
  64 |     // UPDATE: Click Edit button (Pencil icon)
  65 |     await bagRow.locator('button[title="Edit"]').click();
  66 | 
  67 |     const editModalHeading = page.getByRole('heading', { name: 'Edit Master Bag' });
  68 |     await expect(editModalHeading).toBeVisible();
  69 | 
  70 |     const editDialog = page.getByRole('dialog');
  71 |     await editDialog.getByRole('button', { name: 'Save Changes' }).click();
  72 | 
  73 |     // Assert update success toast
  74 |     await expect(page.getByText(/Updated/i).first()).toBeVisible();
  75 | 
  76 |     // DELETE: Click Delete button (Trash icon)
  77 |     await bagRow.locator('button[title="Delete"]').click();
  78 | 
  79 |     const deleteModalHeading = page.getByRole('heading', { name: 'Delete Master Bag' });
  80 |     await expect(deleteModalHeading).toBeVisible();
  81 | 
  82 |     const deleteDialog = page.getByRole('dialog');
  83 |     await deleteDialog.getByRole('button', { name: 'Delete Bag' }).click();
  84 | 
  85 |     // Assert deletion success & removal from table
  86 |     await expect(page.getByText(/Deleted/i).first()).toBeVisible();
  87 |     
  88 |     // Wait for delete modal dialog to close completely
  89 |     await expect(deleteDialog).not.toBeVisible();
  90 | 
  91 |     // RESET VIEW: Clear search filter to restore full list
  92 |     await searchInput.clear();
  93 |     await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  94 |   });
  95 | });
```