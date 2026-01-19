import { db } from '$lib/server/db/index.js';
import { marketItem } from '$lib/server/db/schema.js';
import { error, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { eq, and } from 'drizzle-orm';

export async function load({ locals, params }) {
	if (!locals.user?.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const id: number = parseInt(params.id);

	const [item] = await db
		.select()
		.from(marketItem)
		.where(and(eq(marketItem.deleted, false), eq(marketItem.id, id)));

	if (!item) {
		return error(404, { message: 'item not found' });
	}

	return {
		marketItem: item
	};
}

export const actions: Actions = {
	default: async ({ locals, params }) => {
		if (!locals.user?.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const [item] = await db
			.select()
			.from(marketItem)
			.where(and(eq(marketItem.deleted, false), eq(marketItem.id, id)));

		if (!item) {
			return error(404, { message: 'item not found' });
		}

		await db
			.update(marketItem)
			.set({ deleted: true, updatedAt: new Date() })
			.where(eq(marketItem.id, id));

		return redirect(302, '/dashboard/admin/admin/market');
	}
};
