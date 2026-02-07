import { db } from '$lib/server/db/index.js';
import { user, session } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
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

	const [queriedUser] = await db.select().from(user).where(eq(user.id, id));

	if (!queriedUser) {
		throw error(404, { message: 'user not found' });
	}

	let piiSuccess = true;

	if (!queriedUser.idvToken) {
		piiSuccess = false;
	}

	let userData;

	try {
		const token = decrypt(queriedUser.idvToken ?? '');
		userData = await getUserData(token);
	} catch {
		piiSuccess = false;
	}

	const { first_name, last_name, primary_email, birthday, phone_number, addresses } = userData;

	const address = addresses?.find((address: { primary: boolean }) => address.primary);

	const pii = piiSuccess
		? {
				first_name,
				last_name,
				primary_email,
				phone_number,
				birthday,
				address
			}
		: null;

	return {
		queriedUser,
		pii
	};
}

export const actions = {
	logout: async ({ locals, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const [queriedUser] = await db.select().from(user).where(eq(user.id, id));

		if (!queriedUser) {
			throw error(404, { message: 'user not found' });
		}

		// Log out user
		await db.delete(session).where(eq(session.userId, id));

		return {
			queriedUser
		};
	},

	fulfil: async ({ locals, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const [queriedUser] = await db.select().from(user).where(eq(user.id, id));

		if (!queriedUser) {
			throw error(404, { message: 'user not found' });
		}

		await db.update(user).set({ stickersShipped: true }).where(eq(user.id, id));
	},

	unfulfil: async ({ locals, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const [queriedUser] = await db.select().from(user).where(eq(user.id, id));

		if (!queriedUser) {
			throw error(404, { message: 'user not found' });
		}

		await db.update(user).set({ stickersShipped: false }).where(eq(user.id, id));
	}
} satisfies Actions;
