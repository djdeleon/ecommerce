import { test, expect } from '@playwright/test';

test.describe('Admin Tracking Numbers Management Workflow', () => {
  test('should execute full tracking number generation, pagination, search, filtering, and viewing', async ({ page }) => {
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const adminEmail = `admin-${uniqueId}@example.com`;
    const clientName = `TN Client ${uniqueId}`;

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

    // Setup: Create a client first so we have one to generate tracking numbers for
    await page.locator('a[href="/admin/clients"]').click();
    await expect(page).toHaveURL('/admin/clients');

    await page.getByRole('button', { name: 'New Client' }).click();
    const createDialog = page.getByRole('dialog');
    await createDialog.getByPlaceholder('Laravel E-Commerce PH').fill(clientName);
    await createDialog.getByRole('button', { name: 'Register Client' }).click();
    await expect(page.getByText(/registered successfully/i).first()).toBeVisible();

    // Navigate to Tracking Numbers
    await page.locator('a[href="/admin/tracking-numbers"]').click();
    await expect(page).toHaveURL('/admin/tracking-numbers');

    // Test Status Filter Dropdown & Clear Filter
    const statusSelect = page.locator('button[role="combobox"]').first();
    await statusSelect.click();
    await page.getByRole('option', { name: 'Unassigned', exact: true }).click();
    await expect(page.getByText('Clear Filter')).toBeVisible();

    await page.getByRole('button', { name: 'Clear Filter' }).click();

    // GENERATE: Open Generate Numbers Modal & generate 15 records to trigger pagination
    await page.getByRole('button', { name: 'Generate Numbers' }).click();
    const generateModalHeading = page.getByRole('heading', { name: 'Generate Tracking Numbers' });
    await expect(generateModalHeading).toBeVisible();

    const generateDialog = page.getByRole('dialog');
    
    // Select the newly created client in combobox
    const clientSelect = generateDialog.locator('button[role="combobox"]');
    await clientSelect.click();
    await page.getByRole('option', { name: clientName }).click();

    // Set pool size to 15 (exceeds default page size of 10)
    const sizeInput = generateDialog.locator('input[type="number"]');
    await sizeInput.clear();
    await sizeInput.fill('15');

    await generateDialog.getByRole('button', { name: 'Generate' }).click();

    // Assert generation success toast
    await expect(page.getByText(/generated successfully/i).first()).toBeVisible();

    // PAGINATION: Verify multiple pages are available and test navigation
    await expect(page.getByText(/Showing page 1 of 2/)).toBeVisible();
    const pageTwo = page.getByRole('button', { name: 'Page 2' });
    await expect(pageTwo).toBeVisible();
    
    await pageTwo.click();
    await expect(page.getByText(/Showing page 2 of 2/)).toBeVisible();
    
    await page.getByRole('button', { name: 'Page 1' }).click();
    await expect(page.getByText(/Showing page 1 of 2/)).toBeVisible();

    // SEARCH: Use search bar to locate generated tracking numbers by client name
    const searchInput = page.getByPlaceholder('Search tracking number or client...');
    await searchInput.fill(clientName);
    await expect(page.getByText('Clear Filter')).toBeVisible();

    // Verify tracking number row appears in filtered table
    const trackingRow = page.locator('tr', { hasText: clientName }).first();
    await expect(trackingRow).toBeVisible();

    // VIEW DETAILS: Click 1st action button (Eye icon) to inspect tracking number details
    await trackingRow.locator('button').nth(0).click();

    const viewModalHeading = page.getByRole('heading', { name: 'Tracking Number Details' });
    await expect(viewModalHeading).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    // RESET VIEW: Clear search filter to restore full list
    await searchInput.clear();
    await expect(page.getByText(/Showing page 1 of/)).toBeVisible();
  });
});