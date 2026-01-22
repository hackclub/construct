import { db } from '$lib/server/db/index.js';
import { user } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const orderedUsers = await db
		.select({
			id: user.id,
			name: user.name,
			profilePicture: user.profilePicture,
			slackId: user.slackId,
			stickerFulfilmentStatus: user.stickerFulfilmentStatus
		})
		.from(user)
		.where(eq(user.stickerFulfilmentStatus, 'ordered'));

	return {
		orderedUsers
	};
}
