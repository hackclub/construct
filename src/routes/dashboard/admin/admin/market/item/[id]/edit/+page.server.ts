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
	default: async ({ request, locals, params }) => {
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

		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString();
		const image = formData.get('image')?.toString();
		const minRequiredShopScore = parseInt(formData.get('minRequiredShopScore')?.toString() || '0');
		const minShopScore = parseInt(formData.get('minShopScore')?.toString() || '0');
		const maxShopScore = parseInt(formData.get('maxShopScore')?.toString() || '0');
		const minPrice = parseInt(formData.get('minPrice')?.toString() || '0');
		const maxPrice = parseInt(formData.get('maxPrice')?.toString() || '0');
		const isPublic = formData.get('isPublic') === 'on';

		// Don't really need to implement proper validation, page is admins only

		if (!name || !description || !image) {
			throw error(400, { message: 'Missing required fields' });
		}

		if (maxPrice < minPrice) {
			throw error(400, { message: 'Max price must be greater than or equal to min price' });
		}

		if (maxShopScore < minShopScore) {
			throw error(400, {
				message: 'Max shop score must be greater than or equal to min shop score'
			});
		}

		await db
			.update(marketItem)
			.set({
				name,
				description,
				image,
				minRequiredShopScore,
				minShopScore,
				maxShopScore,
				minPrice,
				maxPrice,
				isPublic
			})
			.where(eq(marketItem.id, id));

		return redirect(302, '/dashboard/admin/admin/market');
	}
};
