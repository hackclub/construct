import { db } from '$lib/server/db/index.js';
import { user, session } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import type { Actions } from './$types';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'get out, peasant' });
	}

	const users = await db.select().from(user);

	return {
		users
	};
}

export const actions = {
	logoutEveryone: async ({ locals }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'get out, peasant' });
		}

		await db.delete(session);
		
		return {};
	}
} satisfies Actions;
