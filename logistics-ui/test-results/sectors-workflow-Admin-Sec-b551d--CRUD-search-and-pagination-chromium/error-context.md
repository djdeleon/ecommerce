# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sectors-workflow.spec.ts >> Admin Sector Management Workflow >> should execute full sector CRUD, search, and pagination
- Location: tests/e2e/sectors-workflow.spec.ts:4:3

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
  3   | test.describe('Admin Sector Management Workflow', () => {
  4   |   test('should execute full sector CRUD, search, and pagination', async ({ page }) => {
  5   |     const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  6   |     const adminEmail = `admin-${uniqueId}@example.com`;
  7   |     const sectorCode = `R03-SCT-${Math.floor(Math.random() * 900 + 100)}`;
  8   | 
  9   |     // Setup: Register & Login Admin
  10  |     await page.goto('/admin/register');
> 11  |     await page.getByPlaceholder('John').fill('Sector');
      |                                         ^ Error: locator.fill: Target page, context or browser has been closed
  12  |     await page.getByPlaceholder('Doe').fill('Admin');
  13  |     await page.getByPlaceholder('admin@example.com').fill(adminEmail);
  14  |     await page.getByPlaceholder('••••••••').fill('secretPassword123');
  15  |     await page.getByRole('button', { name: 'Register Admin' }).click();
  16  | 
  17  |     await page.goto('/admin/login');
  18  |     await page.getByPlaceholder('Enter your email').fill(adminEmail);
  19  |     await page.getByPlaceholder('Enter your password').fill('secretPassword123');
  20  |     await page.getByRole('button', { name: 'Continue' }).click();
  21  | 
  22  |     // Navigate to Sectors under Network Infrastructure
  23  |     await page.locator('a[href="/admin/network-infrastructures/sectors"]').click();
  24  |     await expect(page).toHaveURL('/admin/network-infrastructures/sectors');
  25  | 
  26  |     // Test Pagination
  27  |     await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  28  |     const pageTwo = page.getByRole('button', { name: 'Page 2' });
  29  |     if (await pageTwo.isVisible()) {
  30  |       await pageTwo.click();
  31  |       await expect(page.getByText(/Showing page 2 of/)).toBeVisible();
  32  |       await page.getByRole('button', { name: 'Page 1' }).click();
  33  |       await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  34  |     }
  35  | 
  36  |     // CREATE: Register a new sector
  37  |     await page.getByRole('button', { name: 'New Sector' }).click();
  38  |     const createModalHeading = page.getByRole('heading', { name: 'Create New Sector' });
  39  |     await expect(createModalHeading).toBeVisible();
  40  | 
  41  |     const createDialog = page.getByRole('dialog');
  42  |     await createDialog.getByPlaceholder('R03-BUL-SJD-01').fill(sectorCode);
  43  |     
  44  |     // Select facility
  45  |     const facilitySelect = createDialog.locator('button[role="combobox"]').first();
  46  |     await facilitySelect.click();
  47  |     await page.getByRole('option').first().click();
  48  | 
  49  |     await createDialog.getByRole('button', { name: 'Create Sector' }).click();
  50  | 
  51  |     // Assert creation success toast
  52  |     await expect(page.getByText(/created successfully/i).first()).toBeVisible();
  53  | 
  54  |     // SEARCH: Use search bar to locate the newly created sector instantly
  55  |     const searchInput = page.getByPlaceholder('Search sector code...');
  56  |     await searchInput.fill(sectorCode);
  57  |     await expect(page.getByText('Clear Filter')).toBeVisible();
  58  | 
  59  |     // Verify sector appears in filtered table
  60  |     await expect(page.getByText(sectorCode)).toBeVisible();
  61  | 
  62  |     // VIEW DETAILS: Click 1st action button (Eye icon)
  63  |     const sectorRow = page.locator('tr', { hasText: sectorCode });
  64  |     await sectorRow.locator('button').nth(0).click();
  65  | 
  66  |     const viewModalHeading = page.getByRole('heading', { name: 'Sector Details' });
  67  |     await expect(viewModalHeading).toBeVisible();
  68  |     await page.getByRole('button', { name: 'Close' }).click();
  69  | 
  70  |     // UPDATE: Click 2nd action button (Pencil icon)
  71  |     await sectorRow.locator('button').nth(1).click();
  72  | 
  73  |     const editModalHeading = page.getByRole('heading', { name: 'Edit Sector' });
  74  |     await expect(editModalHeading).toBeVisible();
  75  | 
  76  |     const editDialog = page.getByRole('dialog');
  77  |     const codeInput = editDialog.locator('input').first();
  78  |     await codeInput.clear();
  79  |     await codeInput.fill(`${sectorCode}-UPD`);
  80  |     await editDialog.getByRole('button', { name: 'Save Changes' }).click();
  81  | 
  82  |     // Assert update success & row reflection
  83  |     await expect(page.getByText(/updated successfully/i).first()).toBeVisible();
  84  |     
  85  |     // Update search input for updated code
  86  |     await searchInput.clear();
  87  |     await searchInput.fill(`${sectorCode}-UPD`);
  88  |     const updatedRow = page.locator('tr', { hasText: `${sectorCode}-UPD` });
  89  |     await expect(updatedRow).toBeVisible();
  90  | 
  91  |     // DELETE: Click 3rd action button (Trash icon)
  92  |     await updatedRow.locator('button').last().click();
  93  | 
  94  |     const deleteModalHeading = page.getByRole('heading', { name: 'Delete Sector' });
  95  |     await expect(deleteModalHeading).toBeVisible();
  96  | 
  97  |     const deleteDialog = page.getByRole('dialog');
  98  |     await deleteDialog.getByRole('button', { name: 'Delete Sector' }).click();
  99  | 
  100 |     // Assert deletion success & removal from table
  101 |     await expect(page.getByText(/deleted successfully/i).first()).toBeVisible();
  102 |     
  103 |     // Wait for delete modal dialog to close completely
  104 |     await expect(deleteDialog).not.toBeVisible();
  105 | 
  106 |     // Verify row is no longer visible in the table
  107 |     const deletedRow = page.locator('tr', { hasText: `${sectorCode}-UPD` });
  108 |     await expect(deletedRow).not.toBeVisible();
  109 | 
  110 |     // RESET VIEW: Clear search filter to restore full sector list
  111 |     await searchInput.clear();
```