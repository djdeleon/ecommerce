# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: network-legs-workflow.spec.ts >> Admin Network Leg Management Workflow >> should execute full network leg CRUD, search, and pagination
- Location: tests/e2e/network-legs-workflow.spec.ts:4:3

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
  3   | test.describe('Admin Network Leg Management Workflow', () => {
  4   |   test('should execute full network leg CRUD, search, and pagination', async ({ page }) => {
  5   |     const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  6   |     const adminEmail = `admin-${uniqueId}@example.com`;
  7   |     const legCode = `LEG-${Math.floor(Math.random() * 9000 + 1000)}`;
  8   | 
  9   |     // Setup: Register & Login Admin
  10  |     await page.goto('/admin/register');
> 11  |     await page.getByPlaceholder('John').fill('Leg');
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
  22  |     // Navigate to Network Legs under Network Infrastructure
  23  |     await page.locator('a[href="/admin/network-infrastructures/network-legs"]').click();
  24  |     await expect(page).toHaveURL('/admin/network-infrastructures/network-legs');
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
  36  |     // CREATE: Register a new network leg
  37  |     await page.getByRole('button', { name: 'New Network Leg' }).click();
  38  |     const createModalHeading = page.getByRole('heading', { name: 'Create New Network Leg' });
  39  |     await expect(createModalHeading).toBeVisible();
  40  | 
  41  |     const createDialog = page.getByRole('dialog');
  42  |     await createDialog.getByPlaceholder('ORG-DST-HL').fill(legCode);
  43  |     
  44  |     // Select origin facility
  45  |     const originSelect = createDialog.locator('button[role="combobox"]').nth(0);
  46  |     await originSelect.click();
  47  |     await page.getByRole('option').first().click();
  48  | 
  49  |     // Select destination facility
  50  |     const destinationSelect = createDialog.locator('button[role="combobox"]').nth(1);
  51  |     await destinationSelect.click();
  52  |     await page.getByRole('option').nth(1).click();
  53  | 
  54  |     // Fill distance and duration
  55  |     await createDialog.locator('input[type="number"]').nth(0).fill('45');
  56  |     await createDialog.locator('input[type="number"]').nth(1).fill('7200');
  57  | 
  58  |     await createDialog.getByRole('button', { name: 'Create Network Leg' }).click();
  59  | 
  60  |     // Assert creation success toast
  61  |     await expect(page.getByText(/created successfully/i).first()).toBeVisible();
  62  | 
  63  |     // SEARCH: Use search bar to locate the newly created network leg instantly
  64  |     const searchInput = page.getByPlaceholder('Search lane code..');
  65  |     await searchInput.fill(legCode);
  66  |     await expect(page.getByText('Clear Filter')).toBeVisible();
  67  | 
  68  |     // Verify network leg appears in filtered table
  69  |     await expect(page.getByText(legCode)).toBeVisible();
  70  | 
  71  |     // VIEW DETAILS: Click 1st action button (Eye icon)
  72  |     const legRow = page.locator('tr', { hasText: legCode });
  73  |     await legRow.locator('button').nth(0).click();
  74  | 
  75  |     const viewModalHeading = page.getByRole('heading', { name: 'Network Leg Details' });
  76  |     await expect(viewModalHeading).toBeVisible();
  77  |     await page.getByRole('button', { name: 'Close' }).click();
  78  | 
  79  |     // UPDATE: Click 2nd action button (Pencil icon)
  80  |     await legRow.locator('button').nth(1).click();
  81  | 
  82  |     const editModalHeading = page.getByRole('heading', { name: 'Edit Network Leg' });
  83  |     await expect(editModalHeading).toBeVisible();
  84  | 
  85  |     const editDialog = page.getByRole('dialog');
  86  |     const codeInput = editDialog.locator('input').first();
  87  |     await codeInput.clear();
  88  |     await codeInput.fill(`${legCode}-UPD`);
  89  |     await editDialog.getByRole('button', { name: 'Save Changes' }).click();
  90  | 
  91  |     // Assert update success & row reflection
  92  |     await expect(page.getByText(/updated successfully/i).first()).toBeVisible();
  93  |     
  94  |     // Update search input for updated code
  95  |     await searchInput.clear();
  96  |     await searchInput.fill(`${legCode}-UPD`);
  97  |     const updatedRow = page.locator('tr', { hasText: `${legCode}-UPD` });
  98  |     await expect(updatedRow).toBeVisible();
  99  | 
  100 |     // DELETE: Click 3rd action button (Trash icon)
  101 |     await updatedRow.locator('button').last().click();
  102 | 
  103 |     const deleteModalHeading = page.getByRole('heading', { name: 'Delete Network Leg' });
  104 |     await expect(deleteModalHeading).toBeVisible();
  105 | 
  106 |     const deleteDialog = page.getByRole('dialog');
  107 |     await deleteDialog.getByRole('button', { name: 'Delete Network Leg' }).click();
  108 | 
  109 |     // Assert deletion success & removal from table
  110 |     await expect(page.getByText(/deleted successfully/i).first()).toBeVisible();
  111 |     
```