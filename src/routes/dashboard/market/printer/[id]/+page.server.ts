import { db } from '$lib/server/db/index.js';
import { printer, printerOrder, user } from '$lib/server/db/schema.js';
import { decrypt } from '$lib/server/encryption';
import { getUserData } from '$lib/server/idvUserData';
import { calculateMarketPrice } from '$lib/utils';
import { error, redirect } from '@sveltejs/kit';
import { eq, and, isNotNull, or } from 'drizzle-orm';
import type { Actions } from './$types';

export async function load({ locals, params, url }) {
	if (!locals.user) {
		throw error(500);
	}

	const id: number = parseInt(params.id);
	const type = url.searchParams.get('type');

	if (isNaN(id)) {
		throw error(400, { message: 'invalid printer id' });
	}

	if (type === 'base') {
		const [basePrinter] = await db
			.select()
			.from(printer)
			.where(and(eq(printer.deleted, false), eq(printer.isPublic, true), eq(printer.id, id)))
			.limit(1);

		if (!basePrinter) {
			throw error(404, { message: 'printer not found' });
		}

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
			printerData: {
				...basePrinter,
				clayPrice: basePrinter.clayPrice || 40
			},
			isBase: true,
			addresses,
			userDataError
		};
	} else {
		const [upgrade] = await db
			.select()
			.from(printer)
			.where(
				and(
					eq(printer.deleted, false),
					eq(printer.isPublic, true),
					eq(printer.id, id),
					isNotNull(printer.requiresId)
				)
			)
			.limit(1);

		if (!upgrade) {
			throw error(404, { message: 'printer upgrade not found' });
		}

		const computedPrice = calculateMarketPrice(
			upgrade.minPrice,
			upgrade.maxPrice,
			upgrade.minShopScore,
			upgrade.maxShopScore,
			locals.user.shopScore
		);

		const discountAmount = (upgrade.maxPrice - computedPrice) / upgrade.maxPrice;

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
			printerData: {
				...upgrade,
				computedPrice,
				discountAmount
			},
			isBase: false,
			addresses,
			userDataError,
			userHasBasePrinter: locals.user.hasBasePrinter
		};
	}
}

export const actions = {
	default: async ({ locals, request, params, url }) => {
		if (!locals.user) {
			throw error(500);
		}

		const id: number = parseInt(params.id);
		const type = url.searchParams.get('type');
		const data = await request.formData();

		if (type === 'base') {
			const addressId = data.get('address')?.toString();
			const notes = data.get('notes')?.toString();

			if (!addressId) {
				throw error(400, { message: 'invalid address id' });
			}

			if (notes === null || notes === undefined || notes.length > 10000) {
				throw error(400, { message: 'stop writing so much in notes' });
			}

			const [basePrinter] = await db
				.select()
				.from(printer)
				.where(and(eq(printer.deleted, false), eq(printer.isPublic, true), eq(printer.id, id)))
				.limit(1);

			if (!basePrinter) {
				throw error(404, { message: 'printer not found' });
			}

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

			if (locals.user.hasBasePrinter) {
				throw error(403, { message: 'you already own a base printer' });
			}

			if (
				basePrinter.clayPrice > locals.user.clay ||
				basePrinter.minRequiredShopScore > locals.user.shopScore
			) {
				throw error(403, { message: "you can't afford this" });
			}

			await db
				.update(user)
				.set({
					clay: locals.user.clay - basePrinter.clayPrice,
					hasBasePrinter: true,
					preferredBasePrinterId: id
				})
				.where(eq(user.id, locals.user.id));

			await db.insert(printerOrder).values({
				userId: locals.user.id,
				printerId: id,
				addressId,
				bricksPaid: 0,
				userNotes: notes
			});

			return redirect(302, '/dashboard/market/printer');
		} else {
			const notes = data.get('notes')?.toString();
			const addressId = data.get('address')?.toString();

			if (notes === null || notes === undefined || notes.length > 10000) {
				throw error(400, { message: 'stop writing so much in notes' });
			}

			const [upgrade] = await db
				.select()
				.from(printer)
				.where(
					and(
						eq(printer.deleted, false),
						eq(printer.isPublic, true),
						eq(printer.id, id),
					isNotNull(printer.requiresId)
				)
			)
			.limit(1);

		if (!upgrade) {
			throw error(404, { message: 'printer upgrade not found' });
		}

		const validOrderedBasePrinter = await db
			.select()
			.from(printerOrder)
			.where(
				and(
					eq(printerOrder.userId, locals.user.id),
					isNotNull(printerOrder.printerId),
					or(
						eq(printerOrder.status, 'awaiting_approval'),
						eq(printerOrder.status, 'fulfilled')
					)
				)
			)
			.limit(1);

		if (!validOrderedBasePrinter || validOrderedBasePrinter.length === 0) {
			throw error(403, { message: 'you need to buy a base printer first' });
		}

		const computedPrice = calculateMarketPrice(
			upgrade.minPrice,
			upgrade.maxPrice,
			upgrade.minShopScore,
			upgrade.maxShopScore,
			locals.user.shopScore
		);

			if (computedPrice > locals.user.brick) {
				throw error(403, { message: "you can't afford this" });
			}

			if (upgrade.minRequiredShopScore > locals.user.shopScore) {
				throw error(403, { message: 'you do not have the required market score' });
			}

			await db
				.update(user)
				.set({
					brick: locals.user.brick - computedPrice
				})
				.where(eq(user.id, locals.user.id));

			await db.insert(printerOrder).values({
				userId: locals.user.id,
				printerId: id,
				addressId: addressId || null,
				bricksPaid: computedPrice,
				userNotes: notes
			});

			return redirect(302, '/dashboard/market/printer');
		}
	}
} satisfies Actions;
