# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fulfillment-sortation/sorting-batches-workflow.spec.ts >> Sorting Batches Management Workflow >> should execute full sorting batch CRUD, pagination, and filters
- Location: tests/e2e/fulfillment-sortation/sorting-batches-workflow.spec.ts:4:3

# Error details

```
Error: locator.fill: Target page, context or browser has been closed
Call log:
  - waiting for getByPlaceholder('John')

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Sorting Batches Management Workflow', () => {
  4   |   test('should execute full sorting batch CRUD, pagination, and filters', async ({ page }) => {
  5   |     const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  6   |     const adminEmail = `admin-${uniqueId}@example.com`;
  7   | 
  8   |     // Setup: Register & Login Admin
  9   |     await page.goto('/admin/register');
> 10  |     await page.getByPlaceholder('John').fill('Test');
      |                                         ^ Error: locator.fill: Target page, context or browser has been closed
  11  |     await page.getByPlaceholder('Doe').fill('Admin');
  12  |     await page.getByPlaceholder('admin@example.com').fill(adminEmail);
  13  |     await page.getByPlaceholder('••••••••').fill('secretPassword123');
  14  |     await page.getByRole('button', { name: 'Register Admin' }).click();
  15  | 
  16  |     await page.goto('/admin/login');
  17  |     await page.getByPlaceholder('Enter your email').fill(adminEmail);
  18  |     await page.getByPlaceholder('Enter your password').fill('secretPassword123');
  19  |     await page.getByRole('button', { name: 'Continue' }).click();
  20  | 
  21  |     // Navigate to Sorting Batches
  22  |     await page.locator('a[href="/admin/fulfillment-sortation/sorting-batches"]').click();
  23  |     await expect(page).toHaveURL('/admin/fulfillment-sortation/sorting-batches');
  24  | 
  25  |     // Test Pagination
  26  |     await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  27  |     const pageTwo = page.getByRole('button', { name: 'Page 2' });
  28  |     if (await pageTwo.isVisible()) {
  29  |       await pageTwo.click();
  30  |       await expect(page.getByText(/Showing page 2 of/)).toBeVisible();
  31  |       await page.getByRole('button', { name: 'Page 1' }).click();
  32  |       await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  33  |     }
  34  | 
  35  |     // Test Status Filter Dropdown & Clear Filter
  36  |     const statusSelect = page.getByRole('combobox', { name: /Filter by Status/i }).or(page.locator('button').filter({ hasText: 'Filter by Status' }));
  37  |     await statusSelect.click();
  38  |     await page.getByRole('option', { name: 'Scheduled', exact: true }).click();
  39  |     await expect(page.getByText('Clear Filter')).toBeVisible();
  40  | 
  41  |     await page.getByRole('button', { name: 'Clear Filter' }).click();
  42  | 
  43  |     // CREATE: Register a new sorting batch
  44  |     await page.getByRole('button', { name: 'New Sorting Batch' }).click();
  45  |     const createModalHeading = page.getByRole('heading', { name: 'Create Sorting Batch' });
  46  |     await expect(createModalHeading).toBeVisible();
  47  | 
  48  |     const createDialog = page.getByRole('dialog');
  49  |     await createDialog.getByRole('button', { name: 'Create Batch' }).click();
  50  | 
  51  |     // Assert creation success toast
  52  |     await expect(page.getByText(/Created/i).first()).toBeVisible();
  53  | 
  54  |     // Grab a batch code from the table to search for it
  55  |     const firstRow = page.locator('tbody tr').first();
  56  |     const batchCode = await firstRow.locator('td').nth(1).textContent();
  57  |     expect(batchCode).toBeTruthy();
  58  | 
  59  |     // SEARCH: Use search bar to locate the sorting batch instantly
  60  |     const searchInput = page.getByPlaceholder('Search batch code...');
  61  |     await searchInput.fill(batchCode!);
  62  |     await expect(page.getByText('Clear Filter')).toBeVisible();
  63  | 
  64  |     // Verify batch appears in filtered table
  65  |     await expect(page.getByText(batchCode!)).toBeVisible();
  66  | 
  67  |     // VIEW DETAILS: Click 1st action button (Eye icon)
  68  |     const batchRow = page.locator('tr', { hasText: batchCode! });
  69  |     await batchRow.locator('button').nth(0).click();
  70  | 
  71  |     const viewModalHeading = page.getByRole('heading', { name: 'Sorting Batch Details' });
  72  |     await expect(viewModalHeading).toBeVisible();
  73  |     await page.getByRole('button', { name: 'Close' }).click();
  74  | 
  75  |     // UPDATE: Click 2nd action button (Pencil icon)
  76  |     await batchRow.locator('button').nth(1).click();
  77  | 
  78  |     const editModalHeading = page.getByRole('heading', { name: 'Edit Sorting Batch' });
  79  |     await expect(editModalHeading).toBeVisible();
  80  | 
  81  |     const editDialog = page.getByRole('dialog');
  82  |     await editDialog.getByRole('button', { name: 'Save Changes' }).click();
  83  | 
  84  |     // Assert update success & row reflection
  85  |     await expect(page.getByText(/Updated/i).first()).toBeVisible();
  86  | 
  87  |     // DELETE: Click 3rd action button (Trash icon)
  88  |     await batchRow.locator('button').last().click();
  89  | 
  90  |     const deleteModalHeading = page.getByRole('heading', { name: 'Delete Sorting Batch' });
  91  |     await expect(deleteModalHeading).toBeVisible();
  92  | 
  93  |     const deleteDialog = page.getByRole('dialog');
  94  |     await deleteDialog.getByRole('button', { name: 'Delete Batch' }).click();
  95  | 
  96  |     // Assert deletion success & removal from table
  97  |     await expect(page.getByText(/Deleted/i).first()).toBeVisible();
  98  |     
  99  |     // Wait for delete modal dialog to close completely
  100 |     await expect(deleteDialog).not.toBeVisible();
  101 | 
  102 |     // RESET VIEW: Clear search filter to restore full list
  103 |     await searchInput.clear();
  104 |     await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  105 |   });
  106 | });
```