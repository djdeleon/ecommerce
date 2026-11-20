# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: clients-workflow.spec.ts >> Admin Client Management Workflow >> should execute full client CRUD and pagination
- Location: tests/e2e/clients-workflow.spec.ts:4:3

# Error details

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('a[href="/admin/clients"]')

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Admin Client Management Workflow', () => {
  4   |   test('should execute full client CRUD and pagination', async ({ page }) => {
  5   |     const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  6   |     const adminEmail = `admin-${uniqueId}@example.com`;
  7   |     const clientName = `Workflow Client ${uniqueId}`;
  8   | 
  9   |     // Setup: Register & Login Admin
  10  |     await page.goto('/admin/register');
  11  |     await page.getByPlaceholder('John').fill('Test');
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
  22  |     // Navigate to Clients
> 23  |     await page.locator('a[href="/admin/clients"]').click();
      |                                                    ^ Error: locator.click: Target page, context or browser has been closed
  24  |     await expect(page).toHaveURL('/admin/clients');
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
  36  |     // Test Status Filter Dropdown & Clear Filter
  37  |     const statusSelect = page.locator('button[role="combobox"]').first();
  38  |     await statusSelect.click();
  39  |     await page.getByRole('option', { name: 'Active', exact: true }).click();
  40  |     await expect(page.getByText('Clear Filter')).toBeVisible();
  41  | 
  42  |     await page.getByRole('button', { name: 'Clear Filter' }).click();
  43  | 
  44  |     // CREATE: Register a new client
  45  |     await page.getByRole('button', { name: 'New Client' }).click();
  46  |     const createModalHeading = page.getByRole('heading', { name: 'Register New Client' });
  47  |     await expect(createModalHeading).toBeVisible();
  48  | 
  49  |     const createDialog = page.getByRole('dialog');
  50  |     await createDialog.getByPlaceholder('Laravel E-Commerce PH').fill(clientName);
  51  |     await createDialog.getByRole('button', { name: 'Register Client' }).click();
  52  | 
  53  |     // Assert creation success toast
  54  |     await expect(page.getByText(/registered successfully/i).first()).toBeVisible();
  55  | 
  56  |     // SEARCH: Use search bar to locate the newly created client instantly
  57  |     const searchInput = page.getByPlaceholder('Search client name...');
  58  |     await searchInput.fill(clientName);
  59  |     await expect(page.getByText('Clear Filter')).toBeVisible();
  60  | 
  61  |     // Verify user appears in filtered table
  62  |     await expect(page.getByText(clientName)).toBeVisible();
  63  | 
  64  |     // VIEW DETAILS: Click 1st action button (Eye icon)
  65  |     const clientRow = page.locator('tr', { hasText: clientName });
  66  |     await clientRow.locator('button').nth(0).click();
  67  | 
  68  |     const viewModalHeading = page.getByRole('heading', { name: 'Client Details' });
  69  |     await expect(viewModalHeading).toBeVisible();
  70  |     await page.getByRole('button', { name: 'Close' }).click();
  71  | 
  72  |     // UPDATE: Click 2nd action button (Pencil icon)
  73  |     await clientRow.locator('button').nth(1).click();
  74  | 
  75  |     const editModalHeading = page.getByRole('heading', { name: 'Edit Client' });
  76  |     await expect(editModalHeading).toBeVisible();
  77  | 
  78  |     const editDialog = page.getByRole('dialog');
  79  |     const nameInput = editDialog.locator('input').first();
  80  |     await nameInput.clear();
  81  |     await nameInput.fill(`${clientName} Updated`);
  82  |     await editDialog.getByRole('button', { name: 'Save Changes' }).click();
  83  | 
  84  |     // Assert update success & row reflection
  85  |     await expect(page.getByText(/updated successfully/i).first()).toBeVisible();
  86  |     const updatedRow = page.locator('tr', { hasText: `${clientName} Updated` });
  87  |     await expect(updatedRow).toBeVisible();
  88  | 
  89  |     // DELETE: Click 3rd action button (Trash icon)
  90  |     await updatedRow.locator('button').last().click();
  91  | 
  92  |     const deleteModalHeading = page.getByRole('heading', { name: 'Delete Client' });
  93  |     await expect(deleteModalHeading).toBeVisible();
  94  | 
  95  |     const deleteDialog = page.getByRole('dialog');
  96  |     await deleteDialog.getByRole('button', { name: 'Delete Client' }).click();
  97  | 
  98  |      // Assert deletion success & removal from table
  99  |     await expect(page.getByText(/deleted successfully/i).first()).toBeVisible();
  100 |     
  101 |     // Wait for delete modal dialog to close completely
  102 |     await expect(deleteDialog).not.toBeVisible();
  103 | 
  104 |     // Verify row is no longer visible in the table
  105 |     const deletedRow = page.locator('tr', { hasText: `${clientName} Updated` });
  106 |     await expect(deletedRow).not.toBeVisible();
  107 | 
  108 |     // RESET VIEW: Clear search filter to restore full client list
  109 |     await searchInput.clear();
  110 |     await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  111 |   });
  112 | });
```