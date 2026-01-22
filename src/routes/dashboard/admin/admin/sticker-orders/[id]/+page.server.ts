import { db } from '$lib/server/db/index.js';
import { user } from '$lib/server/db/schema.js';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';
import { decrypt } from '$lib/server/encryption';
import { getUserData } from '$lib/server/idvUserData';

export async function load({ locals, params }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const id: number = parseInt(params.id);

	const [userData] = await db
		.select({
			id: user.id,
			name: user.name,
			slackId: user.slackId,
			profilePicture: user.profilePicture,
			idvToken: user.idvToken,
			stickerFulfilmentStatus: user.stickerFulfilmentStatus
		})
		.from(user)
		.where(eq(user.id, id))
		.limit(1);

	if (!userData) {
		throw error(404, { message: 'user not found' });
	}

	let address = null;
	let userDataError = false;

	if (userData.idvToken) {
		try {
			const token = decrypt(userData.idvToken);
			const idvUserData = await getUserData(token);
			// Get the first address if available
			if (idvUserData?.addresses && idvUserData.addresses.length > 0) {
				address = idvUserData.addresses[0];
			}
		} catch {
			userDataError = true;
		}
	} else {
		userDataError = true;
	}

	return {
		userData,
		address,
		userDataError
	};
}

export const actions = {
	markFulfilled: async ({ locals, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const [userData] = await db
			.select({
				id: user.id,
				stickerFulfilmentStatus: user.stickerFulfilmentStatus
			})
			.from(user)
			.where(eq(user.id, id))
			.limit(1);

		if (!userData) {
			throw error(404, { message: 'user not found' });
		}

		if (userData.stickerFulfilmentStatus !== 'ordered') {
			throw error(400, { message: 'user does not have ordered stickers' });
		}

		await db
			.update(user)
			.set({
				stickerFulfilmentStatus: 'fulfilled'
			})
			.where(eq(user.id, id));

		return { success: true, message: 'Sticker order marked as fulfilled' };
	}
} satisfies Actions;
