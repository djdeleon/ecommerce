import { test, expect } from '@playwright/test';

test.describe('Admin Fleet Transport Management Workflow', () => {
  test('should execute full fleet transport CRUD, filtering, and pagination', async ({ page }) => {
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const adminEmail = `admin-${uniqueId}@example.com`;
    const testPassword = 'secretPassword123';

    // Setup: Register & Login Admin
    await page.goto('/admin/register');
    await page.getByPlaceholder('John').fill('Test');
    await page.getByPlaceholder('Doe').fill('Admin');
    await page.getByPlaceholder('admin@example.com').fill(adminEmail);
    await page.getByPlaceholder('••••••••').fill(testPassword);
    await page.getByRole('button', { name: 'Register Admin' }).click();

    await page.goto('/admin/login');
    await page.getByPlaceholder('Enter your email').fill(adminEmail);
    await page.getByPlaceholder('Enter your password').fill(testPassword);
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL('/admin/dashboard')

    const token = await page.evaluate(() => {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    });
    const user: any = await page.evaluate(() => {
      const u = localStorage.getItem('user') || sessionStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    });

    expect(token).toBeTruthy();
    expect(user).toBeTruthy();

    const updateResponse = await page.request.put(`http://localhost:8001/api/v1/users/${user.id}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { assignedFacilityId: 1 }
    });
    expect(updateResponse.ok()).toBeTruthy();

    // Navigate to Fleet Transports
    await page.locator('a[href="/admin/fleet-transports"]').click();
    await expect(page).toHaveURL('/admin/fleet-transports');

    // Test Pagination
    await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
    const pageTwo = page.getByRole('button', { name: 'Page 2' });
    if (await pageTwo.isVisible()) {
      await pageTwo.click();
      await expect(page.getByText(/Showing page 2 of/)).toBeVisible();
      await page.getByRole('button', { name: 'Page 1' }).click();
      await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
    }

    // FILTER: Select 'LineHaul' mission type from dropdown
    const filterSelect = page.locator('button[role="combobox"]').first();
    await filterSelect.click();
    await page.getByRole('option', { name: 'LineHaul' }).click();

    // Verify filtered pagination and clear filter
    await expect(page.getByText(/LineHaul/i).first()).toBeVisible();
    await page.getByRole('button', { name: 'Clear Filter' }).click();

    // CREATE: Open New Transport modal and fill out form
    await page.getByRole('button', { name: 'New Transport' }).click();
    const createModalHeading = page.getByRole('heading', { name: 'New Transport Schedule' });
    await expect(createModalHeading).toBeVisible();

    const createDialog = page.getByRole('dialog');

    // Select Vehicle (First combobox in dialog)
    const selects = createDialog.locator('button[role="combobox"]');
    await selects.nth(1).click();
    await page.getByRole('option').first().click();

    // Select Courier
    await selects.nth(2).click();
    await page.getByRole('option').first().click();

    // Select Network Leg (Route) for LineHaul
    await selects.nth(3).click();
    await page.getByRole('option').first().click();

    // Submit form
    await createDialog.getByRole('button', { name: 'Create Schedule' }).click();
    await expect(page.getByText(/created successfully|success/i).first()).toBeVisible();

    // Wait for table rows to be visible
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    // VIEW DETAILS: Click 1st action button (Eye icon)
    await firstRow.locator('button').nth(0).click();
    const viewModalHeading = page.getByRole('heading', { name: /Transport Details/ });
    await expect(viewModalHeading).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // UPDATE: Click 2nd action button (Pencil icon)
    await firstRow.locator('button').nth(1).click();
    const editModalHeading = page.getByRole('heading', { name: /Edit Transport Schedule/ });
    await expect(editModalHeading).toBeVisible();

    const editDialog = page.getByRole('dialog');
    await editDialog.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText(/updated successfully|success/i).first()).toBeVisible();

    // DELETE: Click 3rd action button (Trash icon)
    await firstRow.locator('button').last().click();
    const deleteModalHeading = page.getByRole('heading', { name: 'Delete Fleet Transport' });
    await expect(deleteModalHeading).toBeVisible();

    const deleteDialog = page.getByRole('dialog');
    await deleteDialog.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText(/deleted successfully|success/i).first()).toBeVisible();
  });
});