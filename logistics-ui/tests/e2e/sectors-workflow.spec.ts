import { test, expect } from '@playwright/test';

test.describe('Admin Sector Management Workflow', () => {
  test('should execute full sector CRUD, search, and pagination', async ({ page }) => {
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const adminEmail = `admin-${uniqueId}@example.com`;
    const sectorCode = `R03-SCT-${Math.floor(Math.random() * 900 + 100)}`;

    // Setup: Register & Login Admin
    await page.goto('/admin/register');
    await page.getByPlaceholder('John').fill('Sector');
    await page.getByPlaceholder('Doe').fill('Admin');
    await page.getByPlaceholder('admin@example.com').fill(adminEmail);
    await page.getByPlaceholder('••••••••').fill('secretPassword123');
    await page.getByRole('button', { name: 'Register Admin' }).click();

    await page.goto('/admin/login');
    await page.getByPlaceholder('Enter your email').fill(adminEmail);
    await page.getByPlaceholder('Enter your password').fill('secretPassword123');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Navigate to Sectors under Network Infrastructure
    await page.locator('a[href="/admin/network-infrastructures/sectors"]').click();
    await expect(page).toHaveURL('/admin/network-infrastructures/sectors');

    // Test Pagination
    await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
    const pageTwo = page.getByRole('button', { name: 'Page 2' });
    if (await pageTwo.isVisible()) {
      await pageTwo.click();
      await expect(page.getByText(/Showing page 2 of/)).toBeVisible();
      await page.getByRole('button', { name: 'Page 1' }).click();
      await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
    }

    // CREATE: Register a new sector
    await page.getByRole('button', { name: 'New Sector' }).click();
    const createModalHeading = page.getByRole('heading', { name: 'Create New Sector' });
    await expect(createModalHeading).toBeVisible();

    const createDialog = page.getByRole('dialog');
    await createDialog.getByPlaceholder('R03-BUL-SJD-01').fill(sectorCode);
    
    // Select facility
    const facilitySelect = createDialog.locator('button[role="combobox"]').first();
    await facilitySelect.click();
    await page.getByRole('option').first().click();

    await createDialog.getByRole('button', { name: 'Create Sector' }).click();

    // Assert creation success toast
    await expect(page.getByText(/created successfully/i).first()).toBeVisible();

    // SEARCH: Use search bar to locate the newly created sector instantly
    const searchInput = page.getByPlaceholder('Search sector code...');
    await searchInput.fill(sectorCode);
    await expect(page.getByText('Clear Filter')).toBeVisible();

    // Verify sector appears in filtered table
    await expect(page.getByText(sectorCode)).toBeVisible();

    // VIEW DETAILS: Click 1st action button (Eye icon)
    const sectorRow = page.locator('tr', { hasText: sectorCode });
    await sectorRow.locator('button').nth(0).click();

    const viewModalHeading = page.getByRole('heading', { name: 'Sector Details' });
    await expect(viewModalHeading).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // UPDATE: Click 2nd action button (Pencil icon)
    await sectorRow.locator('button').nth(1).click();

    const editModalHeading = page.getByRole('heading', { name: 'Edit Sector' });
    await expect(editModalHeading).toBeVisible();

    const editDialog = page.getByRole('dialog');
    const codeInput = editDialog.locator('input').first();
    await codeInput.clear();
    await codeInput.fill(`${sectorCode}-UPD`);
    await editDialog.getByRole('button', { name: 'Save Changes' }).click();

    // Assert update success & row reflection
    await expect(page.getByText(/updated successfully/i).first()).toBeVisible();
    
    // Update search input for updated code
    await searchInput.clear();
    await searchInput.fill(`${sectorCode}-UPD`);
    const updatedRow = page.locator('tr', { hasText: `${sectorCode}-UPD` });
    await expect(updatedRow).toBeVisible();

    // DELETE: Click 3rd action button (Trash icon)
    await updatedRow.locator('button').last().click();

    const deleteModalHeading = page.getByRole('heading', { name: 'Delete Sector' });
    await expect(deleteModalHeading).toBeVisible();

    const deleteDialog = page.getByRole('dialog');
    await deleteDialog.getByRole('button', { name: 'Delete Sector' }).click();

    // Assert deletion success & removal from table
    await expect(page.getByText(/deleted successfully/i).first()).toBeVisible();
    
    // Wait for delete modal dialog to close completely
    await expect(deleteDialog).not.toBeVisible();

    // Verify row is no longer visible in the table
    const deletedRow = page.locator('tr', { hasText: `${sectorCode}-UPD` });
    await expect(deletedRow).not.toBeVisible();

    // RESET VIEW: Clear search filter to restore full sector list
    await searchInput.clear();
    await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  });
});