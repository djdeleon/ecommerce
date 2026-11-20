import { test, expect } from '@playwright/test';

test.describe('Sorting Batches Management Workflow', () => {
  test('should execute full sorting batch CRUD, pagination, and filters', async ({ page }) => {
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

    // Navigate to Sorting Batches
    await page.locator('a[href="/admin/fulfillment-sortation/sorting-batches"]').click();
    await expect(page).toHaveURL('/admin/fulfillment-sortation/sorting-batches');

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
    await page.getByRole('option', { name: 'Scheduled', exact: true }).click();
    await expect(page.getByText('Clear Filter')).toBeVisible();

    await page.getByRole('button', { name: 'Clear Filter' }).click();

    // CREATE: Register a new sorting batch
    await page.getByRole('button', { name: 'New Sorting Batch' }).click();
    const createModalHeading = page.getByRole('heading', { name: 'Create Sorting Batch' });
    await expect(createModalHeading).toBeVisible();

    const createDialog = page.getByRole('dialog');
    await createDialog.getByRole('button', { name: 'Create Batch' }).click();

    // Assert creation success toast
    await expect(page.getByText(/Created/i).first()).toBeVisible();

    // Grab a batch code from the table to search for it
    const firstRow = page.locator('tbody tr').first();
    const batchCode = await firstRow.locator('td').nth(1).textContent();
    expect(batchCode).toBeTruthy();

    // SEARCH: Use search bar to locate the sorting batch instantly
    const searchInput = page.getByPlaceholder('Search batch code...');
    await searchInput.fill(batchCode!);
    await expect(page.getByText('Clear Filter')).toBeVisible();

    // Verify batch appears in filtered table
    await expect(page.getByText(batchCode!)).toBeVisible();

    // VIEW DETAILS: Click 1st action button (Eye icon)
    const batchRow = page.locator('tr', { hasText: batchCode! });
    await batchRow.locator('button').nth(0).click();

    const viewModalHeading = page.getByRole('heading', { name: 'Sorting Batch Details' });
    await expect(viewModalHeading).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // UPDATE: Click 2nd action button (Pencil icon)
    await batchRow.locator('button').nth(1).click();

    const editModalHeading = page.getByRole('heading', { name: 'Edit Sorting Batch' });
    await expect(editModalHeading).toBeVisible();

    const editDialog = page.getByRole('dialog');
    await editDialog.getByRole('button', { name: 'Save Changes' }).click();

    // Assert update success & row reflection
    await expect(page.getByText(/Updated/i).first()).toBeVisible();

    // DELETE: Click 3rd action button (Trash icon)
    await batchRow.locator('button').last().click();

    const deleteModalHeading = page.getByRole('heading', { name: 'Delete Sorting Batch' });
    await expect(deleteModalHeading).toBeVisible();

    const deleteDialog = page.getByRole('dialog');
    await deleteDialog.getByRole('button', { name: 'Delete Batch' }).click();

    // Assert deletion success & removal from table
    await expect(page.getByText(/Deleted/i).first()).toBeVisible();
    
    // Wait for delete modal dialog to close completely
    await expect(deleteDialog).not.toBeVisible();

    // RESET VIEW: Clear search filter to restore full list
    await searchInput.clear();
    await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  });
});