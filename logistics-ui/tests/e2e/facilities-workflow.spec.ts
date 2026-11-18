import { test, expect } from '@playwright/test';

test.describe('Admin Facility Management Workflow', () => {
  test('should execute full facility CRUD and pagination', async ({ page }) => {
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const adminEmail = `admin-${uniqueId}@example.com`;
    const facilityName = `Test Facility ${uniqueId}`;
    const facilityAddress = '123 Test Street, Manila, Philippines';

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

    // Navigate to Facilities
    await page.locator('a[href="/admin/facilities"]').click();
    await expect(page).toHaveURL('/admin/facilities');

    // Test Pagination
    await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
    const pageTwo = page.getByRole('button', { name: 'Page 2' });
    if (await pageTwo.isVisible()) {
      await pageTwo.click();
      await expect(page.getByText(/Showing page 2 of/)).toBeVisible();
      await page.getByRole('button', { name: 'Page 1' }).click();
      await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
    }

    // Test Type Filter Dropdown & Clear Filter
    const typeSelect = page.locator('button[role="combobox"]').first();
    await typeSelect.click();
    await page.getByRole('option', { name: 'MegaGateway', exact: true }).click();
    await expect(page.getByText('Clear Filter')).toBeVisible();

    await page.getByRole('button', { name: 'Clear Filter' }).click();

    // CREATE: Register a new facility
    await page.getByRole('button', { name: 'New Facility' }).click();
    const createModalHeading = page.getByRole('heading', { name: 'Register New Facility' });
    await expect(createModalHeading).toBeVisible();

    const createDialog = page.getByRole('dialog');
    await createDialog.getByPlaceholder('Bulacan Mega Gateway').fill(facilityName);
    await createDialog.getByPlaceholder('Street address...').fill(facilityAddress);
    await createDialog.getByRole('button', { name: 'Register Facility' }).click();

    // Assert creation success toast
    await expect(page.getByText(/Facility created successfully/i).first()).toBeVisible();

    // SEARCH: Use search bar to locate the newly created facility instantly
    const searchInput = page.getByPlaceholder('Search facility name...');
    await searchInput.fill(facilityName);
    await expect(page.getByText('Clear Filter')).toBeVisible();

    // Verify facility appears in filtered table
    await expect(page.getByText(facilityName)).toBeVisible();

    // VIEW DETAILS: Click 1st action button (Eye icon)
    const facilityRow = page.locator('tr', { hasText: facilityName });
    await facilityRow.locator('button').nth(0).click();

    const viewModalHeading = page.getByRole('heading', { name: 'Facility Details' });
    await expect(viewModalHeading).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // UPDATE: Click 2nd action button (Pencil icon)
    await facilityRow.locator('button').nth(1).click();

    const editModalHeading = page.getByRole('heading', { name: 'Edit Facility' });
    await expect(editModalHeading).toBeVisible();

    const editDialog = page.getByRole('dialog');
    const nameInput = editDialog.locator('input').first();
    await nameInput.clear();
    await nameInput.fill(`${facilityName} Updated`);
    await editDialog.getByRole('button', { name: 'Save Changes' }).click();

    // Assert update success & row reflection
    await expect(page.getByText(/Facility updated successfully/i).first()).toBeVisible();
    const updatedRow = page.locator('tr', { hasText: `${facilityName} Updated` });
    await expect(updatedRow).toBeVisible();

    // DELETE: Click 3rd action button (Trash icon)
    await updatedRow.locator('button').last().click();

    const deleteModalHeading = page.getByRole('heading', { name: 'Delete Facility' });
    await expect(deleteModalHeading).toBeVisible();

    const deleteDialog = page.getByRole('dialog');
    await deleteDialog.getByRole('button', { name: 'Delete Facility' }).click();

    // Assert deletion success & removal from table
    await expect(page.getByText(/Facility deleted successfully/i).first()).toBeVisible();

    // Wait for delete modal dialog to close completely
    await expect(deleteDialog).not.toBeVisible();

    // Verify row is no longer visible in the table
    const deletedRow = page.locator('tr', { hasText: `${facilityName} Updated` });
    await expect(deletedRow).not.toBeVisible();

    // RESET VIEW: Clear search filter to restore full facility list
    await searchInput.clear();
    await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  });
});