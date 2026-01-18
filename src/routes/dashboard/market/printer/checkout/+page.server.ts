import { db } from '$lib/server/db/index.js';
import { printer, user, printerOrder } from '$lib/server/db/schema.js';
import { calculateMarketPrice } from '$lib/utils';
import { decrypt } from '$lib/server/encryption';
import { getUserData } from '$lib/server/idvUserData';
import { error, redirect } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import type { Actions } from './$types';

export async function load({ locals, url }) {
	if (!locals.user) {
		throw error(500);
	}

	const baseIdStr = url.searchParams.get('base');
	const upgradesStr = url.searchParams.get('upgrades');

	if (!baseIdStr) {
		throw error(400, { message: 'No base printer selected' });
	}

	const baseId = parseInt(baseIdStr);
	let upgradeIds: number[] = [];
	try {
		upgradeIds = JSON.parse(upgradesStr || '[]');
	} catch {
		throw error(400, { message: 'Invalid upgrade ids' });
	}

	// Load base printer
	const [basePrinter] = await db
		.select()
		.from(printer)
		.where(and(eq(printer.deleted, false), eq(printer.isPublic, true), eq(printer.id, baseId)))
		.limit(1);

	if (!basePrinter) {
		throw error(404, { message: 'Base printer not found' });
	}

	// Load upgrades
	const upgrades = [];
	let totalBricks = 0;
	for (const id of upgradeIds) {
		const [upgrade] = await db
			.select()
			.from(printer)
			.where(
				and(
					eq(printer.deleted, false),
					eq(printer.isPublic, true),
					eq(printer.id, id),
					eq(printer.requiresId, baseId)
				)
			)
			.limit(1);

		if (!upgrade) {
			throw error(404, { message: 'Upgrade not found' });
		}

		const computedPrice = calculateMarketPrice(
			upgrade.minPrice,
			upgrade.maxPrice,
			upgrade.minShopScore,
			upgrade.maxShopScore,
			locals.user.shopScore
		);

		totalBricks += computedPrice;
		upgrades.push({ ...upgrade, computedPrice });
	}

	// Load addresses
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

	const totalClay = basePrinter.clayPrice || 40;

	return {
		basePrinter: { ...basePrinter, clayPrice: totalClay },
		upgrades,
		totalClay,
		totalBricks,
		addresses,
		userDataError
	};
}

export const actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) {
			throw error(500);
		}

		const data = await request.formData();
		const baseIdStr = data.get('baseId')?.toString();
		const upgradeIdsStr = data.get('upgradeIds')?.toString();
		const addressId = data.get('address')?.toString();
		const notes = data.get('notes')?.toString() || '';

		if (!baseIdStr) {
			throw error(400, { message: 'No base printer selected' });
		}

		const baseId = parseInt(baseIdStr);
		let upgradeIds: number[] = [];
		try {
			upgradeIds = JSON.parse(upgradeIdsStr || '[]');
		} catch {
			throw error(400, { message: 'Invalid upgrade ids' });
		}

		if (notes.length > 10000) {
			throw error(400, { message: 'stop writing so much in notes' });
		}

		const [basePrinter] = await db
			.select()
			.from(printer)
			.where(and(eq(printer.deleted, false), eq(printer.isPublic, true), eq(printer.id, baseId)))
			.limit(1);

		if (!basePrinter) {
			throw error(404, { message: 'Base printer not found' });
		}

		if (locals.user.hasBasePrinter) {
			throw error(403, { message: 'you already own a base printer' });
		}

		let totalBricks = 0;
		const upgradeNames: string[] = [];

		for (const id of upgradeIds) {
			const [upgrade] = await db
				.select()
				.from(printer)
				.where(
					and(
						eq(printer.deleted, false),
						eq(printer.isPublic, true),
						eq(printer.id, id),
						eq(printer.requiresId, baseId)
					)
				)
				.limit(1);

			if (!upgrade) {
				throw error(404, { message: 'Upgrade not found' });
			}

			const computedPrice = calculateMarketPrice(
				upgrade.minPrice,
				upgrade.maxPrice,
				upgrade.minShopScore,
				upgrade.maxShopScore,
				locals.user.shopScore
			);

			totalBricks += computedPrice;
			upgradeNames.push(upgrade.name);
		}

		if (basePrinter.minRequiredShopScore > locals.user.shopScore) {
			throw error(403, { message: 'not enough market score for base' });
		}

		for (const id of upgradeIds) {
			const upgrade = await db
				.select()
				.from(printer)
				.where(eq(printer.id, id))
				.limit(1);

			if (upgrade[0] && upgrade[0].minRequiredShopScore > locals.user.shopScore) {
				throw error(403, { message: 'not enough market score for upgrade' });
			}
		}

		const clayCost = basePrinter.clayPrice || 40;

		if (clayCost > locals.user.clay || totalBricks > locals.user.brick) {
			throw error(403, { message: "you can't afford this" });
		}

		let userData = null;
		if (addressId) {
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
		}

		await db
			.update(user)
			.set({
				clay: locals.user.clay - clayCost,
				brick: locals.user.brick - totalBricks,
				hasBasePrinter: true,
				preferredBasePrinterId: baseId
			})
			.where(eq(user.id, locals.user.id));

		const upgradeNotes = upgradeNames.length > 0 ? `Upgrades: ${upgradeNames.join(', ')}` : '';

		await db.insert(printerOrder).values({
			userId: locals.user.id,
			printerId: baseId,
			addressId: addressId || null,
			bricksPaid: totalBricks,
			userNotes: notes,
			notes: upgradeNotes
		});

		return redirect(302, '/dashboard/market/printer');
	}
} satisfies Actions;