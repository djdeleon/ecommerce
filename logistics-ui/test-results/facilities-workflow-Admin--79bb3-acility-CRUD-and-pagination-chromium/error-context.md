# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: facilities-workflow.spec.ts >> Admin Facility Management Workflow >> should execute full facility CRUD and pagination
- Location: tests/e2e/facilities-workflow.spec.ts:4:3

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
  3   | test.describe('Admin Facility Management Workflow', () => {
  4   |   test('should execute full facility CRUD and pagination', async ({ page }) => {
  5   |     const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  6   |     const adminEmail = `admin-${uniqueId}@example.com`;
  7   |     const facilityName = `Test Facility ${uniqueId}`;
  8   |     const facilityAddress = '123 Test Street, Manila, Philippines';
  9   | 
  10  |     // Setup: Register & Login Admin
  11  |     await page.goto('/admin/register');
> 12  |     await page.getByPlaceholder('John').fill('Test');
      |                                         ^ Error: locator.fill: Target page, context or browser has been closed
  13  |     await page.getByPlaceholder('Doe').fill('Admin');
  14  |     await page.getByPlaceholder('admin@example.com').fill(adminEmail);
  15  |     await page.getByPlaceholder('••••••••').fill('secretPassword123');
  16  |     await page.getByRole('button', { name: 'Register Admin' }).click();
  17  | 
  18  |     await page.goto('/admin/login');
  19  |     await page.getByPlaceholder('Enter your email').fill(adminEmail);
  20  |     await page.getByPlaceholder('Enter your password').fill('secretPassword123');
  21  |     await page.getByRole('button', { name: 'Continue' }).click();
  22  | 
  23  |     // Navigate to Facilities
  24  |     await page.locator('a[href="/admin/network-infrastructures/facilities"]').click();
  25  |     await expect(page).toHaveURL('/admin/network-infrastructures/facilities');
  26  | 
  27  |     // Test Pagination
  28  |     await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  29  |     const pageTwo = page.getByRole('button', { name: 'Page 2' });
  30  |     if (await pageTwo.isVisible()) {
  31  |       await pageTwo.click();
  32  |       await expect(page.getByText(/Showing page 2 of/)).toBeVisible();
  33  |       await page.getByRole('button', { name: 'Page 1' }).click();
  34  |       await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  35  |     }
  36  | 
  37  |     // Test Type Filter Dropdown & Clear Filter
  38  |     const typeSelect = page.locator('button[role="combobox"]').first();
  39  |     await typeSelect.click();
  40  |     await page.getByRole('option', { name: 'MegaGateway', exact: true }).click();
  41  |     await expect(page.getByText('Clear Filter')).toBeVisible();
  42  | 
  43  |     await page.getByRole('button', { name: 'Clear Filter' }).click();
  44  | 
  45  |     // CREATE: Register a new facility
  46  |     await page.getByRole('button', { name: 'New Facility' }).click();
  47  |     const createModalHeading = page.getByRole('heading', { name: 'Register New Facility' });
  48  |     await expect(createModalHeading).toBeVisible();
  49  | 
  50  |     const createDialog = page.getByRole('dialog');
  51  |     await createDialog.getByPlaceholder('Bulacan Mega Gateway').fill(facilityName);
  52  |     await createDialog.getByPlaceholder('Street address...').fill(facilityAddress);
  53  |     await createDialog.getByRole('button', { name: 'Register Facility' }).click();
  54  | 
  55  |     // Assert creation success toast
  56  |     await expect(page.getByText(/Facility created successfully/i).first()).toBeVisible();
  57  | 
  58  |     // SEARCH: Use search bar to locate the newly created facility instantly
  59  |     const searchInput = page.getByPlaceholder('Search facility name...');
  60  |     await searchInput.fill(facilityName);
  61  |     await expect(page.getByText('Clear Filter')).toBeVisible();
  62  | 
  63  |     // Verify facility appears in filtered table
  64  |     await expect(page.getByText(facilityName)).toBeVisible();
  65  | 
  66  |     // VIEW DETAILS: Click 1st action button (Eye icon)
  67  |     const facilityRow = page.locator('tr', { hasText: facilityName });
  68  |     await facilityRow.locator('button').nth(0).click();
  69  | 
  70  |     const viewModalHeading = page.getByRole('heading', { name: 'Facility Details' });
  71  |     await expect(viewModalHeading).toBeVisible();
  72  |     await page.getByRole('button', { name: 'Close' }).click();
  73  | 
  74  |     // UPDATE: Click 2nd action button (Pencil icon)
  75  |     await facilityRow.locator('button').nth(1).click();
  76  | 
  77  |     const editModalHeading = page.getByRole('heading', { name: 'Edit Facility' });
  78  |     await expect(editModalHeading).toBeVisible();
  79  | 
  80  |     const editDialog = page.getByRole('dialog');
  81  |     const nameInput = editDialog.locator('input').first();
  82  |     await nameInput.clear();
  83  |     await nameInput.fill(`${facilityName} Updated`);
  84  |     await editDialog.getByRole('button', { name: 'Save Changes' }).click();
  85  | 
  86  |     // Assert update success & row reflection
  87  |     await expect(page.getByText(/Facility updated successfully/i).first()).toBeVisible();
  88  |     const updatedRow = page.locator('tr', { hasText: `${facilityName} Updated` });
  89  |     await expect(updatedRow).toBeVisible();
  90  | 
  91  |     // DELETE: Click 3rd action button (Trash icon)
  92  |     await updatedRow.locator('button').last().click();
  93  | 
  94  |     const deleteModalHeading = page.getByRole('heading', { name: 'Delete Facility' });
  95  |     await expect(deleteModalHeading).toBeVisible();
  96  | 
  97  |     const deleteDialog = page.getByRole('dialog');
  98  |     await deleteDialog.getByRole('button', { name: 'Delete Facility' }).click();
  99  | 
  100 |     // Assert deletion success & removal from table
  101 |     await expect(page.getByText(/Facility deleted successfully/i).first()).toBeVisible();
  102 | 
  103 |     // Wait for delete modal dialog to close completely
  104 |     await expect(deleteDialog).not.toBeVisible();
  105 | 
  106 |     // Verify row is no longer visible in the table
  107 |     const deletedRow = page.locator('tr', { hasText: `${facilityName} Updated` });
  108 |     await expect(deletedRow).not.toBeVisible();
  109 | 
  110 |     // RESET VIEW: Clear search filter to restore full facility list
  111 |     await searchInput.clear();
  112 |     await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
```