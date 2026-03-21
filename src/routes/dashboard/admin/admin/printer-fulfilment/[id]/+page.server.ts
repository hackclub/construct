import { db } from '$lib/server/db/index.js';
import { user, printerOrder, printerFulfilmentStatus } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';
import { decrypt } from '$lib/server/encryption';
import { getUserData } from '$lib/server/idvUserData';

type FulfilmentStatus = (typeof printerFulfilmentStatus.enumValues)[number];

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

	const orders = await db
		.select()
		.from(printerOrder)
		.where(eq(printerOrder.userId, id));

	let piiSuccess = true;
	let userData;

	if (queriedUser.idvToken) {
		try {
			const token = decrypt(queriedUser.idvToken);
			userData = await getUserData(token);
		} catch {
			piiSuccess = false;
		}
	} else {
		piiSuccess = false;
	}

	const { first_name, last_name, primary_email, phone_number, addresses } = userData ?? {};

	const address = addresses?.find((a: { primary: boolean }) => a.primary);

	const pii = piiSuccess
		? {
				first_name,
				last_name,
				primary_email,
				phone_number,
				address
			}
		: null;

	return {
		queriedUser,
		orders,
		pii,
		fulfilmentStatuses: printerFulfilmentStatus.enumValues
	};
}

export const actions = {
	setStatus: async ({ locals, params, request }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const data = await request.formData();
		const status = data.get('status')?.toString() as FulfilmentStatus | undefined;

		if (!status || !(printerFulfilmentStatus.enumValues as string[]).includes(status)) {
			throw error(400, { message: 'invalid status' });
		}

		const [queriedUser] = await db.select().from(user).where(eq(user.id, id));

		if (!queriedUser) {
			throw error(404, { message: 'user not found' });
		}

		await db.update(user).set({ printerFulfilment: status }).where(eq(user.id, id));

		return { updated: true };
	}
} satisfies Actions;
