import { db } from '$lib/server/db/index.js';
import { marketItem } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';

export async function load({ locals }) {
	if (!locals.user?.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const marketItems = await db.select().from(marketItem).where(eq(marketItem.deleted, false));

	return {
		marketItems
	};
}

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		if (!locals.user?.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const formData = await request.formData();
		const id = parseInt(formData.get('id')?.toString() || '0');

		if (!id) {
			throw error(400, { message: 'Missing item id' });
		}

		await db
			.update(marketItem)
			.set({ deleted: true, updatedAt: new Date() })
			.where(eq(marketItem.id, id));

		return { success: true };
	}
};
