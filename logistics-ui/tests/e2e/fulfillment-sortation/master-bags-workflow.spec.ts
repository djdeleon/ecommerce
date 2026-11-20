import { test, expect } from '@playwright/test';

test.describe('Master Bags Management Workflow', () => {
  test('should execute full master bag workflow including pagination, filters, and actions', async ({ page }) => {
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const adminEmail = `admin-${uniqueId}@example.com`;

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

    // Navigate to Master Bags
    await page.locator('a[href="/admin/fulfillment-sortation/master-bags"]').click();
    await expect(page).toHaveURL('/admin/fulfillment-sortation/master-bags');

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
    const statusSelect = page.getByRole('combobox', { name: /Filter by Status/i }).or(page.locator('button').filter({ hasText: 'Filter by Status' }));
    await statusSelect.click();
    await page.getByRole('option', { name: 'Open', exact: true }).click();
    await expect(page.getByText('Clear Filter')).toBeVisible();

    await page.getByRole('button', { name: 'Clear Filter' }).click();

    // Grab a master bag code from the table to interact with it
    const firstRow = page.locator('tbody tr').first();
    const bagCode = await firstRow.locator('td').nth(1).textContent();
    expect(bagCode).toBeTruthy();

    // SEARCH: Use search bar to locate the master bag instantly
    const searchInput = page.getByPlaceholder('Search master bag code...');
    await searchInput.fill(bagCode!);
    await expect(page.getByText('Clear Filter')).toBeVisible();

    // Verify master bag appears in filtered table
    await expect(page.getByText(bagCode!)).toBeVisible();

    // VIEW DETAILS: Click View Details button (Eye icon)
    const bagRow = page.locator('tr', { hasText: bagCode! });
    await bagRow.locator('button[title="View Details"]').click();

    const viewModalHeading = page.getByRole('heading', { name: 'Master Bag Details' });
    await expect(viewModalHeading).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // UPDATE: Click Edit button (Pencil icon)
    await bagRow.locator('button[title="Edit"]').click();

    const editModalHeading = page.getByRole('heading', { name: 'Edit Master Bag' });
    await expect(editModalHeading).toBeVisible();

    const editDialog = page.getByRole('dialog');
    await editDialog.getByRole('button', { name: 'Save Changes' }).click();

    // Assert update success toast
    await expect(page.getByText(/Updated/i).first()).toBeVisible();

    // DELETE: Click Delete button (Trash icon)
    await bagRow.locator('button[title="Delete"]').click();

    const deleteModalHeading = page.getByRole('heading', { name: 'Delete Master Bag' });
    await expect(deleteModalHeading).toBeVisible();

    const deleteDialog = page.getByRole('dialog');
    await deleteDialog.getByRole('button', { name: 'Delete Bag' }).click();

    // Assert deletion success & removal from table
    await expect(page.getByText(/Deleted/i).first()).toBeVisible();
    
    // Wait for delete modal dialog to close completely
    await expect(deleteDialog).not.toBeVisible();

    // RESET VIEW: Clear search filter to restore full list
    await searchInput.clear();
    await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  });
});