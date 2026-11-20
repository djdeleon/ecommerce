# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: vehicles/vehicle-profiles-workflow.spec.ts >> Admin Vehicle Profiles Workflow >> should execute full vehicle profile CRUD and search filtering
- Location: tests/e2e/vehicles/vehicle-profiles-workflow.spec.ts:4:3

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
  3   | test.describe('Admin Vehicle Profiles Workflow', () => {
  4   |   test('should execute full vehicle profile CRUD and search filtering', async ({ page }) => {
  5   |     const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  6   |     const adminEmail = `admin-vp-${uniqueId}@example.com`;
  7   |     const brandName = `Brand-${uniqueId}`;
  8   |     const modelName = `Model-X-${uniqueId}`;
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
  23  |     // Navigate to Vehicle Profiles
  24  |     await page.locator('a[href="/admin/vehicles/vehicle-profiles"]').click();
  25  |     await expect(page).toHaveURL('/admin/vehicles/vehicle-profiles');
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
  37  |     // CREATE: Create a new vehicle profile
  38  |     await page.getByRole('button', { name: 'New Profile' }).click();
  39  |     const createModalHeading = page.getByRole('heading', { name: 'Create Vehicle Profile' });
  40  |     await expect(createModalHeading).toBeVisible();
  41  | 
  42  |     const createDialog = page.getByRole('dialog');
  43  |     await createDialog.getByPlaceholder('Mitsubishi').fill(brandName);
  44  |     await createDialog.getByPlaceholder('L300').fill(modelName);
  45  |     await createDialog.getByPlaceholder('Aluminum Van').fill('Standard Cargo');
  46  | 
  47  |     // Fill numeric fields
  48  |     await createDialog.locator('input[type="number"]').nth(0).fill('2000000'); // Weight
  49  |     await createDialog.locator('input[type="number"]').nth(1).fill('5.5');     // Volume
  50  | 
  51  |     await createDialog.getByRole('button', { name: 'Create Profile' }).click();
  52  | 
  53  |     // Assert creation success toast
  54  |     await expect(page.getByText(/created successfully/i).first()).toBeVisible();
  55  | 
  56  |     // SEARCH: Verify computed filtering works for Brand or Model
  57  |     const searchInput = page.getByPlaceholder('Search model name...');
  58  | 
  59  |     // Search by Brand
  60  |     await searchInput.fill(brandName);
  61  |     await expect(page.getByText(brandName)).toBeVisible();
  62  |     await expect(page.getByText(modelName)).toBeVisible();
  63  | 
  64  |     // Search by Model
  65  |     await searchInput.clear();
  66  |     await searchInput.fill(modelName);
  67  |     await expect(page.getByText(brandName)).toBeVisible();
  68  | 
  69  |     // VIEW DETAILS: Verify data in view modal
  70  |     const profileRow = page.locator('tr', { hasText: modelName });
  71  |     await profileRow.locator('button').nth(0).click(); // Eye icon
  72  | 
  73  |     // Scope locators to the dialog to avoid finding background table text
  74  |     const viewDialog = page.getByRole('dialog');
  75  |     await expect(viewDialog.getByRole('heading', { name: 'Vehicle Profile Details' })).toBeVisible();
  76  | 
  77  |     // We use .first() or check within the dialog specifically
  78  |     await expect(viewDialog.getByText(brandName)).toBeVisible();
  79  |     await expect(viewDialog.getByText(modelName)).toBeVisible();
  80  | 
  81  |     await viewDialog.getByRole('button', { name: 'Close' }).click();
  82  | 
  83  |     // UPDATE: Edit the brand name
  84  |     await profileRow.locator('button').nth(1).click(); // Pencil icon
  85  | 
  86  |     const editDialog = page.getByRole('dialog');
  87  |     await expect(page.getByRole('heading', { name: 'Edit Vehicle Profile' })).toBeVisible();
  88  | 
  89  |     const brandInput = editDialog.locator('input').first();
  90  |     await brandInput.clear();
  91  |     await brandInput.fill(`${brandName} Updated`);
  92  |     await editDialog.getByRole('button', { name: 'Save Changes' }).click();
  93  | 
  94  |     // Assert update reflection
  95  |     await expect(page.getByText(/updated successfully/i).first()).toBeVisible();
  96  |     await expect(page.locator('tr', { hasText: `${brandName} Updated` })).toBeVisible();
  97  | 
  98  |     // DELETE: Remove the profile
  99  |     const updatedRow = page.locator('tr', { hasText: `${brandName} Updated` });
  100 |     await updatedRow.locator('button').last().click(); // Trash icon
  101 | 
  102 |     const deleteDialog = page.getByRole('dialog');
  103 |     await expect(page.getByRole('heading', { name: 'Delete Vehicle Profile' })).toBeVisible();
  104 |     await deleteDialog.getByRole('button', { name: 'Delete Profile' }).click();
  105 | 
  106 |     // Assert deletion success & table update
  107 |     await expect(page.getByText(/deleted successfully/i).first()).toBeVisible();
  108 |     await expect(deleteDialog).not.toBeVisible();
  109 |     await expect(page.locator('tr', { hasText: modelName })).not.toBeVisible();
  110 | 
  111 |     // RESET: Clear filters
  112 |     await page.getByRole('button', { name: 'Clear Filter' }).click();
```