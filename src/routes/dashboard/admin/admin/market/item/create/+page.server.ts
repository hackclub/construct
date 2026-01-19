import { db } from '$lib/server/db/index.js';
import { marketItem } from '$lib/server/db/schema.js';
import { error, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export async function load({ locals }) {
	if (!locals.user?.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	return {};
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user?.hasAdmin) {
			throw error(403, { message: 'oi get out' });
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

		// Don't need to implement proper validation, page is admins only

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

		await db.insert(marketItem).values({
			createdBy: locals.user.id,
			name,
			description,
			image,
			minRequiredShopScore,
			minShopScore,
			maxShopScore,
			minPrice,
			maxPrice,
			isPublic
		});

		return redirect(302, '/dashboard/admin/admin/market');
	}
};
