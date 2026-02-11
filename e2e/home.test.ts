import { expect, test } from '@playwright/test';

test('homepage has expected heading and content', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toContainText(['What is this?']);
	await expect(page.getByText('Spend 40 hours doing CAD projects, get a 3D printer!')).toBeVisible();
});

test('homepage has login button when not authenticated', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'Login with Hack Club' })).toBeVisible();
});

test('homepage has FAQ section', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('Frequently asked questions')).toBeVisible();
	await expect(page.getByText('Is this free?')).toBeVisible();
	await expect(page.getByText('What can I make?')).toBeVisible();
});

test('homepage has footer', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('A Hack Club program.')).toBeVisible();
});
