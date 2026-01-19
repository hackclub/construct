import { db } from '$lib/server/db/index.js';
import { marketItem, marketItemOrder, user } from '$lib/server/db/schema.js';
import { decrypt } from '$lib/server/encryption';
import { getUserData } from '$lib/server/idvUserData';
import { calculateMarketPrice } from '$lib/utils';
import { error, redirect } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import type { Actions } from './$types';

export async function load({ locals, params }) {
	if (!locals.user) {
		throw error(500);
	}

	const id: number = parseInt(params.id);

	const itemWithPrice = await getItemWithPrice(id, locals);

	let userDataError = false;
	let addresses = null;

	if (locals.user.idvToken) {
		let userData = null;

		try {
			const token = decrypt(locals.user.idvToken);
			userData = await getUserData(token);
		} catch {
			userDataError = true;
		}

		addresses = userData?.addresses;
	} else {
		userDataError = true;
	}

	return {
		marketItem: itemWithPrice,
		addresses,
		userDataError
	};
}

export const actions = {
	default: async ({ locals, request, params }) => {
		if (!locals.user) {
			throw error(500);
		}

		const id: number = parseInt(params.id);

		const data = await request.formData();
		const addressId = data.get('address')?.toString();
		const notes = data.get('notes')?.toString();

		if (!addressId) {
			throw error(400, { message: 'invalid address id' });
		}

		if (notes === null || notes === undefined || notes.length > 10000) {
			throw error(400, { message: 'stop writing so much in notes' });
		}

		const itemWithPrice = await getItemWithPrice(id, locals);

		let userData = null;

		try {
			const token = decrypt(locals.user.idvToken!);
			userData = await getUserData(token);
		} catch {
			throw error(403, { message: 'failed to fetch address, try logging out and back in' });
		}

		const addresses: [{ id: string | null }] | null = userData?.addresses;

		if (!addresses || !addresses.length || addresses.length <= 0) {
			throw error(400, { message: 'no addresses added on auth.hackclub.com' });
		}

		const address = addresses.find((addr) => addr.id! === addressId);

		if (!address) {
			throw error(400, { message: 'chosen address not found' });
		}

		// Check if user can afford
		if (
			itemWithPrice.computedPrice > locals.user.brick ||
			itemWithPrice.minRequiredShopScore > locals.user.shopScore
		) {
			throw error(403, { message: "you can't afford this" });
		}

		await db
			.update(user)
			.set({
				brick: locals.user.brick - itemWithPrice.computedPrice
			})
			.where(eq(user.id, locals.user.id));

		await db.insert(marketItemOrder).values({
			userId: locals.user.id,
			marketItemId: id,
			addressId,
			bricksPaid: itemWithPrice.computedPrice,
			userNotes: notes
		});

		// TODO: change this to orders page
		return redirect(302, '/dashboard/market');
	}
} satisfies Actions;

async function getItemWithPrice(id: number, locals: { user: { shopScore: number } | null }) {
	const [item] = await db
		.select({
			id: marketItem.id,
			name: marketItem.name,
			description: marketItem.description,
			image: marketItem.image,
			minPrice: marketItem.minPrice,
			maxPrice: marketItem.maxPrice,
			minShopScore: marketItem.minShopScore,
			maxShopScore: marketItem.maxShopScore,
			minRequiredShopScore: marketItem.minRequiredShopScore
		})
		.from(marketItem)
		.where(and(eq(marketItem.deleted, false), eq(marketItem.isPublic, true), eq(marketItem.id, id)))
		.limit(1);

	if (!item) {
		throw error(404, { message: 'market item not found' });
	}

	const shopScore = locals.user!.shopScore;
	const computedPrice = calculateMarketPrice(
		item.minPrice,
		item.maxPrice,
		item.minShopScore,
		item.maxShopScore,
		shopScore
	);
	const discountAmount = 1 - computedPrice / item.maxPrice;

	const itemWithPrice = { ...item, computedPrice, discountAmount };

	return itemWithPrice;
}
