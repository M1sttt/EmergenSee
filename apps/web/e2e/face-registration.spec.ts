import { test, expect, type Page } from '@playwright/test';

const MOCK_USER = {
	id: '507f1f77bcf86cd799439011',
	email: 'test@emergensee.com',
	firstName: 'Test',
	lastName: 'User',
	role: 'STAFF',
	faceIdentity: null,
};

async function mockCamera(page: Page): Promise<void> {
	await page.addInitScript(() => {
		const canvas = document.createElement('canvas');
		canvas.width = 320;
		canvas.height = 240;
		const stream = canvas.captureStream(0);
		Object.defineProperty(navigator, 'mediaDevices', {
			value: { getUserMedia: () => Promise.resolve(stream) },
			writable: true,
			configurable: true,
		});
	});
}

async function injectAuth(page: Page): Promise<void> {
	await page.addInitScript((user) => {
		localStorage.setItem(
			'auth-storage',
			JSON.stringify({
				state: {
					user,
					accessToken: 'mock-access-token',
					refreshToken: 'mock-refresh-token',
					isAuthenticated: true,
				},
				version: 0,
			}),
		);
	}, MOCK_USER);
}

test.describe('face registration skip button', () => {
	test.beforeEach(async ({ context }) => {
		await context.grantPermissions(['camera']);
	});

	test('first-time login navigates to /register-face and shows skip button', async ({ page }) => {
		await mockCamera(page);

		// Abort mediapipe CDN requests so the page enters error phase immediately
		await page.route(/cdn\.jsdelivr\.net|storage\.googleapis\.com/, route => route.abort());

		await page.route('**/auth/login', route =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					user: MOCK_USER,
					accessToken: 'mock-access-token',
					refreshToken: 'mock-refresh-token',
				}),
			}),
		);

		await page.goto('/login');

		await page.fill('input[type="email"]', MOCK_USER.email);
		await page.fill('input[type="password"]', 'Password123!');
		await page.click('button[type="submit"]');

		await page.waitForURL('**/register-face');

		await expect(page.getByTestId('skip-button')).toBeVisible();
	});

	test('navigating directly to /register-face does not show skip button', async ({ page }) => {
		await mockCamera(page);
		await injectAuth(page);
		await page.route(/cdn\.jsdelivr\.net|storage\.googleapis\.com/, route => route.abort());

		await page.goto('/register-face');

		await expect(page.getByRole('heading', { name: 'Register Your Face' })).toBeVisible({
			timeout: 15_000,
		});
		await expect(page.getByTestId('skip-button')).not.toBeVisible();
	});
});
