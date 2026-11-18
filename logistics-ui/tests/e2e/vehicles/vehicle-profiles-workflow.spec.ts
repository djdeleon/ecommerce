import { test, expect } from '@playwright/test';

test.describe('Admin Vehicle Profiles Workflow', () => {
  test('should execute full vehicle profile CRUD and search filtering', async ({ page }) => {
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const adminEmail = `admin-vp-${uniqueId}@example.com`;
    const brandName = `Brand-${uniqueId}`;
    const modelName = `Model-X-${uniqueId}`;

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

    // Navigate to Vehicle Profiles
    await page.locator('a[href="/admin/vehicles/vehicle-profiles"]').click();
    await expect(page).toHaveURL('/admin/vehicles/vehicle-profiles');

    // Test Pagination
    await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
    const pageTwo = page.getByRole('button', { name: 'Page 2' });
    if (await pageTwo.isVisible()) {
      await pageTwo.click();
      await expect(page.getByText(/Showing page 2 of/)).toBeVisible();
      await page.getByRole('button', { name: 'Page 1' }).click();
      await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
    }

    // CREATE: Create a new vehicle profile
    await page.getByRole('button', { name: 'New Profile' }).click();
    const createModalHeading = page.getByRole('heading', { name: 'Create Vehicle Profile' });
    await expect(createModalHeading).toBeVisible();

    const createDialog = page.getByRole('dialog');
    await createDialog.getByPlaceholder('Mitsubishi').fill(brandName);
    await createDialog.getByPlaceholder('L300').fill(modelName);
    await createDialog.getByPlaceholder('Aluminum Van').fill('Standard Cargo');

    // Fill numeric fields
    await createDialog.locator('input[type="number"]').nth(0).fill('2000000'); // Weight
    await createDialog.locator('input[type="number"]').nth(1).fill('5.5');     // Volume

    await createDialog.getByRole('button', { name: 'Create Profile' }).click();

    // Assert creation success toast
    await expect(page.getByText(/created successfully/i).first()).toBeVisible();

    // SEARCH: Verify computed filtering works for Brand or Model
    const searchInput = page.getByPlaceholder('Search model name...');

    // Search by Brand
    await searchInput.fill(brandName);
    await expect(page.getByText(brandName)).toBeVisible();
    await expect(page.getByText(modelName)).toBeVisible();

    // Search by Model
    await searchInput.clear();
    await searchInput.fill(modelName);
    await expect(page.getByText(brandName)).toBeVisible();

    // VIEW DETAILS: Verify data in view modal
    const profileRow = page.locator('tr', { hasText: modelName });
    await profileRow.locator('button').nth(0).click(); // Eye icon

    // Scope locators to the dialog to avoid finding background table text
    const viewDialog = page.getByRole('dialog');
    await expect(viewDialog.getByRole('heading', { name: 'Vehicle Profile Details' })).toBeVisible();

    // We use .first() or check within the dialog specifically
    await expect(viewDialog.getByText(brandName)).toBeVisible();
    await expect(viewDialog.getByText(modelName)).toBeVisible();

    await viewDialog.getByRole('button', { name: 'Close' }).click();

    // UPDATE: Edit the brand name
    await profileRow.locator('button').nth(1).click(); // Pencil icon

    const editDialog = page.getByRole('dialog');
    await expect(page.getByRole('heading', { name: 'Edit Vehicle Profile' })).toBeVisible();

    const brandInput = editDialog.locator('input').first();
    await brandInput.clear();
    await brandInput.fill(`${brandName} Updated`);
    await editDialog.getByRole('button', { name: 'Save Changes' }).click();

    // Assert update reflection
    await expect(page.getByText(/updated successfully/i).first()).toBeVisible();
    await expect(page.locator('tr', { hasText: `${brandName} Updated` })).toBeVisible();

    // DELETE: Remove the profile
    const updatedRow = page.locator('tr', { hasText: `${brandName} Updated` });
    await updatedRow.locator('button').last().click(); // Trash icon

    const deleteDialog = page.getByRole('dialog');
    await expect(page.getByRole('heading', { name: 'Delete Vehicle Profile' })).toBeVisible();
    await deleteDialog.getByRole('button', { name: 'Delete Profile' }).click();

    // Assert deletion success & table update
    await expect(page.getByText(/deleted successfully/i).first()).toBeVisible();
    await expect(deleteDialog).not.toBeVisible();
    await expect(page.locator('tr', { hasText: modelName })).not.toBeVisible();

    // RESET: Clear filters
    await page.getByRole('button', { name: 'Clear Filter' }).click();
    await expect(searchInput).toHaveValue('');
  });
});