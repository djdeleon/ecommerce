import { test, expect } from '@playwright/test';

test.describe('Admin Client Management Workflow', () => {
  test('should execute full client CRUD and pagination', async ({ page }) => {
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const adminEmail = `admin-${uniqueId}@example.com`;
    const clientName = `Workflow Client ${uniqueId}`;

    // Setup: Register & Login Admin
    await page.goto('/admin/register');
    await page.getByPlaceholder('John').fill('Test');
    await page.getByPlaceholder('Doe').fill('Admin');
    await page.getByPlaceholder('admin@example.com').fill(adminEmail);
    await page.getByPlaceholder('••••••••').fill('secretPassword123');
    await page.getByRole('button', { name: 'Register Admin' }).click();

    await page.goto('/admin/login');
    await page.getByPlaceholder('Enter your email').fill(adminEmail);
    await page.getByPlaceholder('Enter your password').fill('secretPassword123');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Navigate to Clients
    await page.locator('a[href="/admin/clients"]').click();
    await expect(page).toHaveURL('/admin/clients');

    // Test Pagination
    await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
    const pageTwo = page.getByRole('button', { name: 'Page 2' });
    if (await pageTwo.isVisible()) {
      await pageTwo.click();
      await expect(page.getByText(/Showing page 2 of/)).toBeVisible();
      await page.getByRole('button', { name: 'Page 1' }).click();
      await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
    }

    // Test Status Filter Dropdown & Clear Filter
    const statusSelect = page.locator('button[role="combobox"]').first();
    await statusSelect.click();
    await page.getByRole('option', { name: 'Active', exact: true }).click();
    await expect(page.getByText('Clear Filter')).toBeVisible();

    await page.getByRole('button', { name: 'Clear Filter' }).click();

    // CREATE: Register a new client
    await page.getByRole('button', { name: 'New Client' }).click();
    const createModalHeading = page.getByRole('heading', { name: 'Register New Client' });
    await expect(createModalHeading).toBeVisible();

    const createDialog = page.getByRole('dialog');
    await createDialog.getByPlaceholder('Laravel E-Commerce PH').fill(clientName);
    await createDialog.getByRole('button', { name: 'Register Client' }).click();

    // Assert creation success toast
    await expect(page.getByText(/registered successfully/i).first()).toBeVisible();

    // SEARCH: Use search bar to locate the newly created client instantly
    const searchInput = page.getByPlaceholder('Search client name...');
    await searchInput.fill(clientName);
    await expect(page.getByText('Clear Filter')).toBeVisible();

    // Verify user appears in filtered table
    await expect(page.getByText(clientName)).toBeVisible();

    // VIEW DETAILS: Click 1st action button (Eye icon)
    const clientRow = page.locator('tr', { hasText: clientName });
    await clientRow.locator('button').nth(0).click();

    const viewModalHeading = page.getByRole('heading', { name: 'Client Details' });
    await expect(viewModalHeading).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // UPDATE: Click 2nd action button (Pencil icon)
    await clientRow.locator('button').nth(1).click();

    const editModalHeading = page.getByRole('heading', { name: 'Edit Client' });
    await expect(editModalHeading).toBeVisible();

    const editDialog = page.getByRole('dialog');
    const nameInput = editDialog.locator('input').first();
    await nameInput.clear();
    await nameInput.fill(`${clientName} Updated`);
    await editDialog.getByRole('button', { name: 'Save Changes' }).click();

    // Assert update success & row reflection
    await expect(page.getByText(/updated successfully/i).first()).toBeVisible();
    const updatedRow = page.locator('tr', { hasText: `${clientName} Updated` });
    await expect(updatedRow).toBeVisible();

    // DELETE: Click 3rd action button (Trash icon)
    await updatedRow.locator('button').last().click();

    const deleteModalHeading = page.getByRole('heading', { name: 'Delete Client' });
    await expect(deleteModalHeading).toBeVisible();

    const deleteDialog = page.getByRole('dialog');
    await deleteDialog.getByRole('button', { name: 'Delete Client' }).click();

     // Assert deletion success & removal from table
    await expect(page.getByText(/deleted successfully/i).first()).toBeVisible();
    
    // Wait for delete modal dialog to close completely
    await expect(deleteDialog).not.toBeVisible();

    // Verify row is no longer visible in the table
    const deletedRow = page.locator('tr', { hasText: `${clientName} Updated` });
    await expect(deletedRow).not.toBeVisible();

    // RESET VIEW: Clear search filter to restore full client list
    await searchInput.clear();
    await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  });
});