# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: vehicles/physical-vehicles-workflow.spec.ts >> Admin Physical Vehicles Workflow >> should execute full physical vehicle CRUD, search filtering, status filtering, and view workflow
- Location: tests/e2e/vehicles/physical-vehicles-workflow.spec.ts:4:3

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
  3   | test.describe('Admin Physical Vehicles Workflow', () => {
  4   |   test('should execute full physical vehicle CRUD, search filtering, status filtering, and view workflow', async ({ page }) => {
  5   |     const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  6   |     const adminEmail = `admin-pv-${uniqueId}@example.com`;
  7   |     const plateNumber = `ABC-${uniqueId.slice(-4)}`;
  8   | 
  9   |     // Setup: Register & Login Admin
  10  |     await page.goto('/admin/register');
> 11  |     await page.getByPlaceholder('John').fill('Test');
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
  22  |     // Navigate to Physical Vehicles
  23  |     await page.locator('a[href="/admin/vehicles/physical-vehicles"]').click();
  24  |     await expect(page).toHaveURL('/admin/vehicles/physical-vehicles');
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
  36  |     // CREATE: Add a new physical vehicle
  37  |     await page.getByRole('button', { name: 'Add Vehicle' }).click();
  38  |     const createModalHeading = page.getByRole('heading', { name: 'Add Physical Vehicle' });
  39  |     await expect(createModalHeading).toBeVisible();
  40  | 
  41  |     const createDialog = page.getByRole('dialog');
  42  |     await createDialog.getByPlaceholder('ABC-1234').fill(plateNumber);
  43  |     await createDialog.getByPlaceholder('Optional').fill('VIN-99998888');
  44  | 
  45  |     // Select the first available vehicle profile from dropdown
  46  |     await createDialog.locator('button').filter({ hasText: 'Select Profile' }).click();
  47  |     await page.locator('[role="option"]').first().click();
  48  | 
  49  |     await createDialog.getByRole('button', { name: 'Add to Fleet' }).click();
  50  | 
  51  |     // Assert creation success toast
  52  |     await expect(page.getByText(/created successfully/i).first()).toBeVisible();
  53  | 
  54  |     // SEARCH: Verify plate number filtering works
  55  |     const searchInput = page.getByPlaceholder('Search plate number...');
  56  |     await searchInput.fill(plateNumber);
  57  |     await expect(page.getByText(plateNumber)).toBeVisible();
  58  | 
  59  |     // CLEAR SEARCH & TEST STATUS FILTER
  60  |     await page.getByRole('button', { name: 'Clear Filter' }).click();
  61  |     await expect(searchInput).toHaveValue('');
  62  | 
  63  |     // FILTER BY STATUS: Test status filtering dropdown
  64  |     const statusFilter = page.getByRole('combobox').filter({ hasText: 'Filter by Status' });
  65  |     await statusFilter.click();
  66  |     // Select 'Available' status option from the dropdown
  67  |     await page.locator('[role="option"]').filter({ hasText: 'Available' }).click();
  68  |     
  69  |     // Verify filtering is applied (table shows available vehicles or empty state)
  70  |     await expect(page.getByText(/Showing page/)).toBeVisible();
  71  | 
  72  |     // Reset status filter by clicking Clear Filter
  73  |     await page.getByRole('button', { name: 'Clear Filter' }).click();
  74  | 
  75  |     // VIEW DETAILS: Verify data in view modal
  76  |     const vehicleRow = page.locator('tr', { hasText: plateNumber });
  77  |     await vehicleRow.locator('button').nth(0).click(); // Eye icon
  78  | 
  79  |     const viewDialog = page.getByRole('dialog');
  80  |     await expect(viewDialog.getByRole('heading', { name: 'Vehicle Details' })).toBeVisible();
  81  |     await expect(viewDialog.getByText(plateNumber)).toBeVisible();
  82  | 
  83  |     await viewDialog.getByRole('button', { name: 'Close' }).click();
  84  | 
  85  |     // UPDATE: Edit vehicle status or plate number
  86  |     await vehicleRow.locator('button').nth(1).click(); // Pencil icon
  87  | 
  88  |     const editDialog = page.getByRole('dialog');
  89  |     await expect(page.getByRole('heading', { name: 'Edit Vehicle' })).toBeVisible();
  90  | 
  91  |     const plateInput = editDialog.locator('input').first();
  92  |     await plateInput.clear();
  93  |     await plateInput.fill(`${plateNumber}-UPD`);
  94  |     await editDialog.getByRole('button', { name: 'Save Changes' }).click();
  95  | 
  96  |     // Assert update reflection
  97  |     await expect(page.getByText(/updated successfully/i).first()).toBeVisible();
  98  |     await expect(page.locator('tr', { hasText: `${plateNumber}-UPD` })).toBeVisible();
  99  | 
  100 |     // DELETE: Remove the vehicle from fleet
  101 |     const updatedRow = page.locator('tr', { hasText: `${plateNumber}-UPD` });
  102 |     await updatedRow.locator('button').last().click(); // Trash icon
  103 | 
  104 |     const deleteDialog = page.getByRole('dialog');
  105 |     await expect(page.getByRole('heading', { name: 'Delete Vehicle' })).toBeVisible();
  106 |     await deleteDialog.getByRole('button', { name: 'Delete' }).click();
  107 | 
  108 |     // Assert deletion success & table update
  109 |     await expect(page.getByText(/deleted successfully/i).first()).toBeVisible();
  110 |     await expect(deleteDialog).not.toBeVisible();
  111 |     await expect(page.locator('tr', { hasText: `${plateNumber}-UPD` })).not.toBeVisible();
```