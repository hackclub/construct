import { env } from '$env/dynamic/private';

export async function sendSlackDM(userId: string, message: string) {
	const token = env.SLACK_BOT_TOKEN;

	if (!token) {
		console.warn('SLACK_BOT_TOKEN not configured');
		return;
	}

	try {
		const res = await fetch('https://slack.com/api/chat.postMessage', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify({
				channel: userId,
				text: message
			})
		});

		const data = await res.json();

		if (!data.ok) {
			console.error('Failed to send Slack DM:', data.error);
		}
	} catch (err) {
		console.error('Error sending Slack DM:', err);
	}
}
