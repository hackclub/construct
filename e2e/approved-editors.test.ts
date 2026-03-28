import { expect, test } from '@playwright/test';

test('approved editors page has heading', async ({ page }) => {
	await page.goto('/approved-editors');
	await expect(page.getByRole('heading', { name: 'Approved editors' })).toBeVisible();
});

test('approved editors page lists all editors', async ({ page }) => {
	await page.goto('/approved-editors');
	await expect(page.getByText('Fusion 360')).toBeVisible();
	await expect(page.getByText('Onshape')).toBeVisible();
	await expect(page.getByText('Blender')).toBeVisible();
	await expect(page.getByText('FreeCAD')).toBeVisible();
	await expect(page.getByText('OpenSCAD')).toBeVisible();
	await expect(page.getByText('Solvespace')).toBeVisible();
});

test('approved editors page has back link', async ({ page }) => {
	await page.goto('/approved-editors');
	await expect(page.getByRole('link', { name: 'Back' })).toBeVisible();
});

test('approved editors page mentions no TinkerCAD', async ({ page }) => {
	await page.goto('/approved-editors');
	await expect(page.getByText('No TinkerCAD please.')).toBeVisible();
});
