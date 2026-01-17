import { db } from '$lib/server/db/index.js';
import { printer } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';

export async function load({ locals }) {
	if (!locals.user?.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const printers = await db.select().from(printer).where(eq(printer.deleted, false));

	return {
		printers
	};
}

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user?.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const formData = await request.formData();
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString();
		const image = formData.get('image')?.toString();
		const isBase = formData.get('isBase') === 'on';
		const clayPrice = isBase ? parseInt(formData.get('clayPrice')?.toString() || '40') : 0;
		const minPrice = isBase ? 0 : parseInt(formData.get('minPrice')?.toString() || '0');
		const maxPrice = isBase ? 0 : parseInt(formData.get('maxPrice')?.toString() || '0');
		const minShopScore = isBase ? 0 : parseInt(formData.get('minShopScore')?.toString() || '0');
		const maxShopScore = isBase ? 0 : parseInt(formData.get('maxShopScore')?.toString() || '0');
		const minRequiredShopScore = parseInt(formData.get('minRequiredShopScore')?.toString() || '0');
		const requiresId = isBase ? null : (parseInt(formData.get('requiresId')?.toString() || '') || null);
		const isPublic = formData.get('isPublic') === 'on';

		if (!name || !description || !image) {
			throw error(400, { message: 'Missing required fields' });
		}

		await db.insert(printer).values({
			name,
			description,
			image,
			clayPrice,
			minPrice,
			maxPrice,
			minShopScore,
			maxShopScore,
			minRequiredShopScore,
			requiresId,
			isPublic
		});

		return { success: true };
	},

	update: async ({ request, locals }) => {
		if (!locals.user?.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const formData = await request.formData();
		const id = parseInt(formData.get('id')?.toString() || '0');
		const name = formData.get('name')?.toString();
		const description = formData.get('description')?.toString();
		const image = formData.get('image')?.toString();
		const isBase = formData.get('isBase') === 'on';
		const clayPrice = isBase ? parseInt(formData.get('clayPrice')?.toString() || '40') : 0;
		const minPrice = isBase ? 0 : parseInt(formData.get('minPrice')?.toString() || '0');
		const maxPrice = isBase ? 0 : parseInt(formData.get('maxPrice')?.toString() || '0');
		const minShopScore = isBase ? 0 : parseInt(formData.get('minShopScore')?.toString() || '0');
		const maxShopScore = isBase ? 0 : parseInt(formData.get('maxShopScore')?.toString() || '0');
		const minRequiredShopScore = parseInt(formData.get('minRequiredShopScore')?.toString() || '0');
		const requiresId = isBase ? null : (parseInt(formData.get('requiresId')?.toString() || '') || null);
		const isPublic = formData.get('isPublic') === 'on';

		if (!id || !name || !description || !image) {
			throw error(400, { message: 'Missing required fields' });
		}

		await db
			.update(printer)
			.set({
				name,
				description,
				image,
				clayPrice,
				minPrice,
				maxPrice,
				minShopScore,
				maxShopScore,
				minRequiredShopScore,
				requiresId,
				isPublic,
				updatedAt: new Date()
			})
			.where(eq(printer.id, id));

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		if (!locals.user?.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const formData = await request.formData();
		const id = parseInt(formData.get('id')?.toString() || '0');

		if (!id) {
			throw error(400, { message: 'Missing printer id' });
		}

		await db
			.update(printer)
			.set({ deleted: true, updatedAt: new Date() })
			.where(eq(printer.id, id));

		return { success: true };
	}
};
