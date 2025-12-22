import { db } from '$lib/server/db/index.js';
import { marketItem } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}

	const marketItems = await db
		.select({
			id: marketItem.id,
			name: marketItem.name,
			description: marketItem.description,
			image: marketItem.image
		})
		.from(marketItem)
		.where(
			and(
				eq(marketItem.deleted, false),
				locals.user.hasAdmin ? undefined : eq(marketItem.isPublic, true)
			)
		);

	return {
		marketItems
	};
}
