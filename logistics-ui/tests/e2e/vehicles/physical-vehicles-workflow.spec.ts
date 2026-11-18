import { test, expect } from '@playwright/test';

test.describe('Admin Physical Vehicles Workflow', () => {
  test('should execute full physical vehicle CRUD, search filtering, status filtering, and view workflow', async ({ page }) => {
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const adminEmail = `admin-pv-${uniqueId}@example.com`;
    const plateNumber = `ABC-${uniqueId.slice(-4)}`;

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

    // Navigate to Physical Vehicles
    await page.locator('a[href="/admin/vehicles/physical-vehicles"]').click();
    await expect(page).toHaveURL('/admin/vehicles/physical-vehicles');

    // Test Pagination
    await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
    const pageTwo = page.getByRole('button', { name: 'Page 2' });
    if (await pageTwo.isVisible()) {
      await pageTwo.click();
      await expect(page.getByText(/Showing page 2 of/)).toBeVisible();
      await page.getByRole('button', { name: 'Page 1' }).click();
      await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
    }

    // CREATE: Add a new physical vehicle
    await page.getByRole('button', { name: 'Add Vehicle' }).click();
    const createModalHeading = page.getByRole('heading', { name: 'Add Physical Vehicle' });
    await expect(createModalHeading).toBeVisible();

    const createDialog = page.getByRole('dialog');
    await createDialog.getByPlaceholder('ABC-1234').fill(plateNumber);
    await createDialog.getByPlaceholder('Optional').fill('VIN-99998888');

    // Select the first available vehicle profile from dropdown
    await createDialog.locator('button').filter({ hasText: 'Select Profile' }).click();
    await page.locator('[role="option"]').first().click();

    await createDialog.getByRole('button', { name: 'Add to Fleet' }).click();

    // Assert creation success toast
    await expect(page.getByText(/created successfully/i).first()).toBeVisible();

    // SEARCH: Verify plate number filtering works
    const searchInput = page.getByPlaceholder('Search plate number...');
    await searchInput.fill(plateNumber);
    await expect(page.getByText(plateNumber)).toBeVisible();

    // CLEAR SEARCH & TEST STATUS FILTER
    await page.getByRole('button', { name: 'Clear Filter' }).click();
    await expect(searchInput).toHaveValue('');

    // FILTER BY STATUS: Test status filtering dropdown
    const statusFilter = page.getByRole('combobox').filter({ hasText: 'Filter by Status' });
    await statusFilter.click();
    // Select 'Available' status option from the dropdown
    await page.locator('[role="option"]').filter({ hasText: 'Available' }).click();
    
    // Verify filtering is applied (table shows available vehicles or empty state)
    await expect(page.getByText(/Showing page/)).toBeVisible();

    // Reset status filter by clicking Clear Filter
    await page.getByRole('button', { name: 'Clear Filter' }).click();

    // VIEW DETAILS: Verify data in view modal
    const vehicleRow = page.locator('tr', { hasText: plateNumber });
    await vehicleRow.locator('button').nth(0).click(); // Eye icon

    const viewDialog = page.getByRole('dialog');
    await expect(viewDialog.getByRole('heading', { name: 'Vehicle Details' })).toBeVisible();
    await expect(viewDialog.getByText(plateNumber)).toBeVisible();

    await viewDialog.getByRole('button', { name: 'Close' }).click();

    // UPDATE: Edit vehicle status or plate number
    await vehicleRow.locator('button').nth(1).click(); // Pencil icon

    const editDialog = page.getByRole('dialog');
    await expect(page.getByRole('heading', { name: 'Edit Vehicle' })).toBeVisible();

    const plateInput = editDialog.locator('input').first();
    await plateInput.clear();
    await plateInput.fill(`${plateNumber}-UPD`);
    await editDialog.getByRole('button', { name: 'Save Changes' }).click();

    // Assert update reflection
    await expect(page.getByText(/updated successfully/i).first()).toBeVisible();
    await expect(page.locator('tr', { hasText: `${plateNumber}-UPD` })).toBeVisible();

    // DELETE: Remove the vehicle from fleet
    const updatedRow = page.locator('tr', { hasText: `${plateNumber}-UPD` });
    await updatedRow.locator('button').last().click(); // Trash icon

    const deleteDialog = page.getByRole('dialog');
    await expect(page.getByRole('heading', { name: 'Delete Vehicle' })).toBeVisible();
    await deleteDialog.getByRole('button', { name: 'Delete' }).click();

    // Assert deletion success & table update
    await expect(page.getByText(/deleted successfully/i).first()).toBeVisible();
    await expect(deleteDialog).not.toBeVisible();
    await expect(page.locator('tr', { hasText: `${plateNumber}-UPD` })).not.toBeVisible();
  });
});