# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: users-workflow.spec.ts >> Admin User Management Flow >> should login and navigate
- Location: tests/e2e/users-workflow.spec.ts:6:3

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
  3   | test.describe('Admin User Management Flow', () => {
  4   |   // kill 2579 2>/dev/null; node -e "const net = require('net'); net.createServer(c => { const s = net.connect(8000, 'logistics'); c.pipe(s); s.pipe(c); }).listen(8001, '::');" &
  5   | 
  6   |   test('should login and navigate', async ({ page }) => {
  7   |     // Generate unique test data
  8   |     const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  9   |     const testEmail = `admin-${uniqueId}@example.com`;
  10  |     const testPassword = 'secretPassword123';
  11  | 
  12  |     // Register a new admin account
  13  |     await page.goto('/admin/register');
> 14  |     await page.getByPlaceholder('John').fill('Test');
      |                                         ^ Error: locator.fill: Target page, context or browser has been closed
  15  |     await page.getByPlaceholder('Doe').fill('Admin');
  16  |     await page.getByPlaceholder('admin@example.com').fill(testEmail);
  17  |     await page.getByPlaceholder('••••••••').fill(testPassword);
  18  |     await page.getByRole('button', { name: 'Register Admin' }).click();
  19  | 
  20  |     await page.goto('/admin/login')
  21  |     await page.getByPlaceholder('Enter your email').fill(testEmail);
  22  |     await page.getByPlaceholder('Enter your password').fill(testPassword);
  23  | 
  24  |     const showPasswordBtn = page.getByRole('button', { name: 'Show password' });
  25  |     await showPasswordBtn.click();
  26  | 
  27  |     await page.getByRole('button', { name: 'Continue' }).click()
  28  | 
  29  |     await expect(page).toHaveURL('/admin/dashboard')
  30  | 
  31  |     const token = await page.evaluate(() => {
  32  |       return localStorage.getItem('token') || sessionStorage.getItem('token');
  33  |     });
  34  | 
  35  |     expect(token).toBeTruthy();
  36  | 
  37  |     await page.locator('a[href="/admin/users"]').click();
  38  |     await expect(page).toHaveURL('/admin/users');
  39  | 
  40  |     // Test Search, Role Filter, and Clear Filter
  41  |     const searchInput = page.locator('input[placeholder="Search name or email..."]');
  42  |     await searchInput.fill('Target');
  43  |     await expect(page.getByText('Clear Filter')).toBeVisible();
  44  | 
  45  |     // Clear filters using the Clear Filter button
  46  |     await page.getByRole('button', { name: 'Clear Filter' }).click();
  47  |     await expect(searchInput).toHaveValue('');
  48  | 
  49  |     // Test Role Filter dropdown
  50  |     const roleSelect = page.locator('button[role="combobox"]').first();
  51  |     await roleSelect.click();
  52  |     await page.getByRole('option', { name: 'Courier' }).click();
  53  |     await expect(page.getByText('Clear Filter')).toBeVisible();
  54  | 
  55  |     // Clear role filter
  56  |     await page.getByRole('button', { name: 'Clear Filter' }).click();
  57  | 
  58  |     // Target pagination page 2 button precisely using aria-label or button role
  59  |     const pageTwoButton = page.getByRole('button', { name: 'Page 2' });
  60  |     await expect(pageTwoButton).toBeVisible();
  61  | 
  62  |     await pageTwoButton.click();
  63  |     await expect(page.getByText(/Showing page 2 of/)).toBeVisible();
  64  | 
  65  |     // Go back to page 1 for creation
  66  |     const pageOneButton = page.getByRole('button', { name: 'Page 1' });
  67  |     await pageOneButton.click();
  68  |     await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  69  | 
  70  |     // CREATE: Add a new user
  71  |     await page.getByRole('button', { name: 'New User' }).click();
  72  |     const newUserEmail = `target-user-${uniqueId}@example.com`;
  73  | 
  74  |     // Ensure the specific Create New User modal is visible
  75  |     const createModalHeading = page.getByRole('heading', { name: 'Create New User' });
  76  |     await expect(createModalHeading).toBeVisible();
  77  | 
  78  |     // Fill the fields using their explicit form labels
  79  |     const dialog = page.getByRole('dialog');
  80  |     await dialog.locator('input[placeholder="John"]').fill('Target');
  81  |     await dialog.locator('input[placeholder="Doe"]').fill('User');
  82  |     await dialog.locator('input[placeholder="john.doe@example.com"]').fill(newUserEmail);
  83  | 
  84  |     await page.getByRole('button', { name: 'Create Account' }).click();
  85  | 
  86  |     await expect(page.getByText('User is registered successfully.').first()).toBeVisible();
  87  | 
  88  |     // Verify user appears in table
  89  |     await expect(page.getByText(newUserEmail)).toBeVisible();
  90  | 
  91  |     // VIEW: Open user details modal
  92  |     const userRow = page.locator('tr', { hasText: newUserEmail });
  93  | 
  94  |     // Click the view (eye) button in that row's actions column (1st button)
  95  |     await userRow.locator('button').nth(0).click();
  96  | 
  97  |     // Ensure User Details modal is visible and shows correct data inside the dialog
  98  |     const viewModalHeading = page.getByRole('heading', { name: 'User Details' });
  99  |     await expect(viewModalHeading).toBeVisible();
  100 | 
  101 |     const viewDialog = page.getByRole('dialog');
  102 |     await expect(viewDialog.getByText(newUserEmail)).toBeVisible();
  103 | 
  104 |     // Close the view modal
  105 |     await viewDialog.getByRole('button', { name: 'Close' }).click();
  106 | 
  107 |     // UPDATE: Edit the newly created user
  108 |     // Click the edit (pencil) button in that row's actions column (2nd button now, after view)
  109 |     await userRow.locator('button').nth(1).click();
  110 | 
  111 |     // Ensure Edit User modal is visible
  112 |     const editModalHeading = page.getByRole('heading', { name: 'Edit User Account' });
  113 |     await expect(editModalHeading).toBeVisible();
  114 | 
```