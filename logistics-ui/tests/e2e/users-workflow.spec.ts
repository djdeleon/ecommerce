import { test, expect } from '@playwright/test';

test.describe('Admin User Management Flow', () => {
  // kill 2579 2>/dev/null; node -e "const net = require('net'); net.createServer(c => { const s = net.connect(8000, 'logistics'); c.pipe(s); s.pipe(c); }).listen(8001, '::');" &

  test('should login and navigate', async ({ page }) => {
    // Generate unique test data
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const testEmail = `admin-${uniqueId}@example.com`;
    const testPassword = 'secretPassword123';

    // Register a new admin account
    await page.goto('/admin/register');
    await page.getByPlaceholder('John').fill('Test');
    await page.getByPlaceholder('Doe').fill('Admin');
    await page.getByPlaceholder('admin@example.com').fill(testEmail);
    await page.getByPlaceholder('••••••••').fill(testPassword);
    await page.getByRole('button', { name: 'Register Admin' }).click();

    await page.goto('/admin/login')
    await page.getByPlaceholder('Enter your email').fill(testEmail);
    await page.getByPlaceholder('Enter your password').fill(testPassword);

    const showPasswordBtn = page.getByRole('button', { name: 'Show password' });
    await showPasswordBtn.click();

    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page).toHaveURL('/admin/dashboard')

    const token = await page.evaluate(() => {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    });

    expect(token).toBeTruthy();

    await page.locator('a[href="/admin/users"]').click();
    await expect(page).toHaveURL('/admin/users');

    // Test Search, Role Filter, and Clear Filter
    const searchInput = page.locator('input[placeholder="Search name or email..."]');
    await searchInput.fill('Target');
    await expect(page.getByText('Clear Filter')).toBeVisible();

    // Clear filters using the Clear Filter button
    await page.getByRole('button', { name: 'Clear Filter' }).click();
    await expect(searchInput).toHaveValue('');

    // Test Role Filter dropdown
    const roleSelect = page.locator('button[role="combobox"]').first();
    await roleSelect.click();
    await page.getByRole('option', { name: 'Courier' }).click();
    await expect(page.getByText('Clear Filter')).toBeVisible();

    // Clear role filter
    await page.getByRole('button', { name: 'Clear Filter' }).click();

    // Target pagination page 2 button precisely using aria-label or button role
    const pageTwoButton = page.getByRole('button', { name: 'Page 2' });
    await expect(pageTwoButton).toBeVisible();

    await pageTwoButton.click();
    await expect(page.getByText(/Showing page 2 of/)).toBeVisible();

    // Go back to page 1 for creation
    const pageOneButton = page.getByRole('button', { name: 'Page 1' });
    await pageOneButton.click();
    await expect(page.getByText(/Showing page 1 of/)).toBeVisible();

    // CREATE: Add a new user
    await page.getByRole('button', { name: 'New User' }).click();
    const newUserEmail = `target-user-${uniqueId}@example.com`;

    // Ensure the specific Create New User modal is visible
    const createModalHeading = page.getByRole('heading', { name: 'Create New User' });
    await expect(createModalHeading).toBeVisible();

    // Fill the fields using their explicit form labels
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[placeholder="John"]').fill('Target');
    await dialog.locator('input[placeholder="Doe"]').fill('User');
    await dialog.locator('input[placeholder="john.doe@example.com"]').fill(newUserEmail);

    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('User is registered successfully.').first()).toBeVisible();

    // Verify user appears in table
    await expect(page.getByText(newUserEmail)).toBeVisible();

    // VIEW: Open user details modal
    const userRow = page.locator('tr', { hasText: newUserEmail });

    // Click the view (eye) button in that row's actions column (1st button)
    await userRow.locator('button').nth(0).click();

    // Ensure User Details modal is visible and shows correct data inside the dialog
    const viewModalHeading = page.getByRole('heading', { name: 'User Details' });
    await expect(viewModalHeading).toBeVisible();

    const viewDialog = page.getByRole('dialog');
    await expect(viewDialog.getByText(newUserEmail)).toBeVisible();

    // Close the view modal
    await viewDialog.getByRole('button', { name: 'Close' }).click();

    // UPDATE: Edit the newly created user
    // Click the edit (pencil) button in that row's actions column (2nd button now, after view)
    await userRow.locator('button').nth(1).click();

    // Ensure Edit User modal is visible
    const editModalHeading = page.getByRole('heading', { name: 'Edit User Account' });
    await expect(editModalHeading).toBeVisible();

    // Target the edit dialog and update the First Name input
    const editDialog = page.getByRole('dialog');
    const firstNameInput = editDialog.locator('input').first();
    await firstNameInput.clear();
    await firstNameInput.fill('UpdatedTarget');

    await editDialog.getByRole('button', { name: 'Save Changes' }).click();

    // Assert update success toast (.first() handles stacked toasts)
    await expect(page.getByText('User is updated successfully.').first()).toBeVisible();

    // Verify updated name inside our specific user's row (avoids matching old rows)
    const updatedUserRow = page.locator('tr', { hasText: newUserEmail });
    await expect(updatedUserRow.locator('td', { hasText: 'UpdatedTarget' })).toBeVisible();

    // DELETE: Remove the test user
    // Click the delete (trash-2) button in the actions column for our user's row
    await updatedUserRow.locator('button').last().click();

    // Ensure the Delete Confirmation Modal is visible
    const deleteModalHeading = page.getByRole('heading', { name: 'Delete User Account' });
    await expect(deleteModalHeading).toBeVisible();

    // Click the confirm delete button inside the modal
    const deleteDialog = page.getByRole('dialog');
    await deleteDialog.getByRole('button', { name: 'Delete User' }).click();

    // Assert deletion success toast
    await expect(page.getByText('User is deleted successfully.').first()).toBeVisible();
  });
});