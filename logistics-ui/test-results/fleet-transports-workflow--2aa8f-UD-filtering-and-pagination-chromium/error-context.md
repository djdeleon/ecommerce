# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fleet-transports-workflow.spec.ts >> Admin Fleet Transport Management Workflow >> should execute full fleet transport CRUD, filtering, and pagination
- Location: tests/e2e/fleet-transports-workflow.spec.ts:4:3

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
  3   | test.describe('Admin Fleet Transport Management Workflow', () => {
  4   |   test('should execute full fleet transport CRUD, filtering, and pagination', async ({ page }) => {
  5   |     const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  6   |     const adminEmail = `admin-${uniqueId}@example.com`;
  7   |     const testPassword = 'secretPassword123';
  8   | 
  9   |     // Setup: Register & Login Admin
  10  |     await page.goto('/admin/register');
> 11  |     await page.getByPlaceholder('John').fill('Test');
      |                                         ^ Error: locator.fill: Target page, context or browser has been closed
  12  |     await page.getByPlaceholder('Doe').fill('Admin');
  13  |     await page.getByPlaceholder('admin@example.com').fill(adminEmail);
  14  |     await page.getByPlaceholder('••••••••').fill(testPassword);
  15  |     await page.getByRole('button', { name: 'Register Admin' }).click();
  16  | 
  17  |     await page.goto('/admin/login');
  18  |     await page.getByPlaceholder('Enter your email').fill(adminEmail);
  19  |     await page.getByPlaceholder('Enter your password').fill(testPassword);
  20  |     await page.getByRole('button', { name: 'Continue' }).click();
  21  | 
  22  |     await expect(page).toHaveURL('/admin/dashboard')
  23  | 
  24  |     const token = await page.evaluate(() => {
  25  |       return localStorage.getItem('token') || sessionStorage.getItem('token');
  26  |     });
  27  |     const user: any = await page.evaluate(() => {
  28  |       const u = localStorage.getItem('user') || sessionStorage.getItem('user');
  29  |       return u ? JSON.parse(u) : null;
  30  |     });
  31  | 
  32  |     expect(token).toBeTruthy();
  33  |     expect(user).toBeTruthy();
  34  | 
  35  |     const updateResponse = await page.request.put(`http://localhost:8001/api/v1/users/${user.id}`, {
  36  |       headers: { 
  37  |         'Authorization': `Bearer ${token}`,
  38  |         'Content-Type': 'application/json'
  39  |       },
  40  |       data: { assignedFacilityId: 1 }
  41  |     });
  42  |     expect(updateResponse.ok()).toBeTruthy();
  43  | 
  44  |     // Navigate to Fleet Transports
  45  |     await page.locator('a[href="/admin/fleet-transports"]').click();
  46  |     await expect(page).toHaveURL('/admin/fleet-transports');
  47  | 
  48  |     // Test Pagination
  49  |     await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  50  |     const pageTwo = page.getByRole('button', { name: 'Page 2' });
  51  |     if (await pageTwo.isVisible()) {
  52  |       await pageTwo.click();
  53  |       await expect(page.getByText(/Showing page 2 of/)).toBeVisible();
  54  |       await page.getByRole('button', { name: 'Page 1' }).click();
  55  |       await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  56  |     }
  57  | 
  58  |     // FILTER: Select 'LineHaul' mission type from dropdown
  59  |     const filterSelect = page.locator('button[role="combobox"]').first();
  60  |     await filterSelect.click();
  61  |     await page.getByRole('option', { name: 'LineHaul' }).click();
  62  | 
  63  |     // Verify filtered pagination and clear filter
  64  |     await expect(page.getByText(/LineHaul/i).first()).toBeVisible();
  65  |     await page.getByRole('button', { name: 'Clear Filter' }).click();
  66  | 
  67  |     // CREATE: Open New Transport modal and fill out form
  68  |     await page.getByRole('button', { name: 'New Transport' }).click();
  69  |     const createModalHeading = page.getByRole('heading', { name: 'New Transport Schedule' });
  70  |     await expect(createModalHeading).toBeVisible();
  71  | 
  72  |     const createDialog = page.getByRole('dialog');
  73  | 
  74  |     // Select Vehicle (First combobox in dialog)
  75  |     const selects = createDialog.locator('button[role="combobox"]');
  76  |     await selects.nth(1).click();
  77  |     await page.getByRole('option').first().click();
  78  | 
  79  |     // Select Courier
  80  |     await selects.nth(2).click();
  81  |     await page.getByRole('option').first().click();
  82  | 
  83  |     // Select Network Leg (Route) for LineHaul
  84  |     await selects.nth(3).click();
  85  |     await page.getByRole('option').first().click();
  86  | 
  87  |     // Submit form
  88  |     await createDialog.getByRole('button', { name: 'Create Schedule' }).click();
  89  |     await expect(page.getByText(/created successfully|success/i).first()).toBeVisible();
  90  | 
  91  |     // Wait for table rows to be visible
  92  |     const firstRow = page.locator('tbody tr').first();
  93  |     await expect(firstRow).toBeVisible({ timeout: 10000 });
  94  | 
  95  |     // VIEW DETAILS: Click 1st action button (Eye icon)
  96  |     await firstRow.locator('button').nth(0).click();
  97  |     const viewModalHeading = page.getByRole('heading', { name: /Transport Details/ });
  98  |     await expect(viewModalHeading).toBeVisible();
  99  |     await page.getByRole('button', { name: 'Close' }).click();
  100 | 
  101 |     // UPDATE: Click 2nd action button (Pencil icon)
  102 |     await firstRow.locator('button').nth(1).click();
  103 |     const editModalHeading = page.getByRole('heading', { name: /Edit Transport Schedule/ });
  104 |     await expect(editModalHeading).toBeVisible();
  105 | 
  106 |     const editDialog = page.getByRole('dialog');
  107 |     await editDialog.getByRole('button', { name: 'Save Changes' }).click();
  108 |     await expect(page.getByText(/updated successfully|success/i).first()).toBeVisible();
  109 | 
  110 |     // DELETE: Click 3rd action button (Trash icon)
  111 |     await firstRow.locator('button').last().click();
```