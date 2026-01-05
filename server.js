import express from 'express';
import { handler } from './build/handler.js';
import { CronJob } from 'cron';

// Run daily at midnight UTC to unclaim expired print claims (older than 7 days)
new CronJob(
	'0 0 * * *', // Every day at midnight
	async function () {
		try {
			const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT ?? 3000}`;
			const response = await fetch(`${baseUrl}/api/cron/unclaim-expired`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${process.env.APP_SECRET_KEY}`
				}
			});
			const result = await response.json();
			console.log(`[Cron] Unclaimed ${result.unclaimedCount} expired print claims`);
		} catch (error) {
			console.error('[Cron] Failed to unclaim expired prints:', error);
		}
	},
	null,
	true,
	'UTC'
);

const app = express();

app.use(handler);

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
	console.log(`Listening on ${port}`);
});
