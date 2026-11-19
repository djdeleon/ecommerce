import { test, expect } from '@playwright/test';

test.describe('Admin Network Leg Management Workflow', () => {
  test('should execute full network leg CRUD, search, and pagination', async ({ page }) => {
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const adminEmail = `admin-${uniqueId}@example.com`;
    const legCode = `LEG-${Math.floor(Math.random() * 9000 + 1000)}`;

    // Setup: Register & Login Admin
    await page.goto('/admin/register');
    await page.getByPlaceholder('John').fill('Leg');
    await page.getByPlaceholder('Doe').fill('Admin');
    await page.getByPlaceholder('admin@example.com').fill(adminEmail);
    await page.getByPlaceholder('••••••••').fill('secretPassword123');
    await page.getByRole('button', { name: 'Register Admin' }).click();

    await page.goto('/admin/login');
    await page.getByPlaceholder('Enter your email').fill(adminEmail);
    await page.getByPlaceholder('Enter your password').fill('secretPassword123');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Navigate to Network Legs under Network Infrastructure
    await page.locator('a[href="/admin/network-infrastructures/network-legs"]').click();
    await expect(page).toHaveURL('/admin/network-infrastructures/network-legs');

    // Test Pagination
    await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
    const pageTwo = page.getByRole('button', { name: 'Page 2' });
    if (await pageTwo.isVisible()) {
      await pageTwo.click();
      await expect(page.getByText(/Showing page 2 of/)).toBeVisible();
      await page.getByRole('button', { name: 'Page 1' }).click();
      await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
    }

    // CREATE: Register a new network leg
    await page.getByRole('button', { name: 'New Network Leg' }).click();
    const createModalHeading = page.getByRole('heading', { name: 'Create New Network Leg' });
    await expect(createModalHeading).toBeVisible();

    const createDialog = page.getByRole('dialog');
    await createDialog.getByPlaceholder('ORG-DST-HL').fill(legCode);
    
    // Select origin facility
    const originSelect = createDialog.locator('button[role="combobox"]').nth(0);
    await originSelect.click();
    await page.getByRole('option').first().click();

    // Select destination facility
    const destinationSelect = createDialog.locator('button[role="combobox"]').nth(1);
    await destinationSelect.click();
    await page.getByRole('option').nth(1).click();

    // Fill distance and duration
    await createDialog.locator('input[type="number"]').nth(0).fill('45');
    await createDialog.locator('input[type="number"]').nth(1).fill('7200');

    await createDialog.getByRole('button', { name: 'Create Network Leg' }).click();

    // Assert creation success toast
    await expect(page.getByText(/created successfully/i).first()).toBeVisible();

    // SEARCH: Use search bar to locate the newly created network leg instantly
    const searchInput = page.getByPlaceholder('Search lane code..');
    await searchInput.fill(legCode);
    await expect(page.getByText('Clear Filter')).toBeVisible();

    // Verify network leg appears in filtered table
    await expect(page.getByText(legCode)).toBeVisible();

    // VIEW DETAILS: Click 1st action button (Eye icon)
    const legRow = page.locator('tr', { hasText: legCode });
    await legRow.locator('button').nth(0).click();

    const viewModalHeading = page.getByRole('heading', { name: 'Network Leg Details' });
    await expect(viewModalHeading).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // UPDATE: Click 2nd action button (Pencil icon)
    await legRow.locator('button').nth(1).click();

    const editModalHeading = page.getByRole('heading', { name: 'Edit Network Leg' });
    await expect(editModalHeading).toBeVisible();

    const editDialog = page.getByRole('dialog');
    const codeInput = editDialog.locator('input').first();
    await codeInput.clear();
    await codeInput.fill(`${legCode}-UPD`);
    await editDialog.getByRole('button', { name: 'Save Changes' }).click();

    // Assert update success & row reflection
    await expect(page.getByText(/updated successfully/i).first()).toBeVisible();
    
    // Update search input for updated code
    await searchInput.clear();
    await searchInput.fill(`${legCode}-UPD`);
    const updatedRow = page.locator('tr', { hasText: `${legCode}-UPD` });
    await expect(updatedRow).toBeVisible();

    // DELETE: Click 3rd action button (Trash icon)
    await updatedRow.locator('button').last().click();

    const deleteModalHeading = page.getByRole('heading', { name: 'Delete Network Leg' });
    await expect(deleteModalHeading).toBeVisible();

    const deleteDialog = page.getByRole('dialog');
    await deleteDialog.getByRole('button', { name: 'Delete Network Leg' }).click();

    // Assert deletion success & removal from table
    await expect(page.getByText(/deleted successfully/i).first()).toBeVisible();
    
    // Wait for delete modal dialog to close completely
    await expect(deleteDialog).not.toBeVisible();

    // Verify row is no longer visible in the table
    const deletedRow = page.locator('tr', { hasText: `${legCode}-UPD` });
    await expect(deletedRow).not.toBeVisible();

    // RESET VIEW: Clear search filter to restore full network leg list
    await searchInput.clear();
    await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  });
});