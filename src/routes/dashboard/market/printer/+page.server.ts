import { db } from '$lib/server/db/index.js';
import { printer, user, printerOrder } from '$lib/server/db/schema.js';
import { calculateMarketPrice } from '$lib/utils';
import { decrypt } from '$lib/server/encryption';
import { getUserData } from '$lib/server/idvUserData';
import { error, redirect } from '@sveltejs/kit';
import { eq, and, isNull, isNotNull, or } from 'drizzle-orm';
import type { Actions } from './$types';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}

	if (locals.user.hasBasePrinter) {
		return { hasBasePrinter: true, preferredPrinter: null, upgrades: [], user: locals.user, addresses: [], userDataError: false };
	}

	const basePrinters = await db
		.select({
			id: printer.id,
			name: printer.name,
			description: printer.description,
			image: printer.image,
			minPrice: printer.minPrice,
			maxPrice: printer.maxPrice,
			minShopScore: printer.minShopScore,
			maxShopScore: printer.maxShopScore,
			minRequiredShopScore: printer.minRequiredShopScore,
			clayPrice: printer.clayPrice,
			requiresId: printer.requiresId
		})
		.from(printer)
		.where(
			and(
				eq(printer.deleted, false),
				eq(printer.isPublic, true),
				isNull(printer.requiresId)
			)
		);

	const basePrintersWithPrice = basePrinters.map((item) => {
		const discountAmount = 0;
		return { ...item, clayPrice: 40, discountAmount };
	});

	let preferredPrinter = null;
	let upgrades = [];
	let hasOrderedBasePrinter = false;

	const validOrderedBasePrinterOrders = await db
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
		);

	if (validOrderedBasePrinterOrders.length > 0) {
		const basePrinterIds = new Set(
			validOrderedBasePrinterOrders.map((order) => order.printerId)
		);

		const basePrintersInOrders = await db
			.select()
			.from(printer)
			.where(
				and(
					isNull(printer.requiresId),
					eq(printer.deleted, false)
				)
			);

		hasOrderedBasePrinter = basePrintersInOrders.some((p) => basePrinterIds.has(p.id));

		if (hasOrderedBasePrinter && validOrderedBasePrinterOrders[0].printerId) {
			const [selectedPrinter] = await db
				.select()
				.from(printer)
				.where(eq(printer.id, validOrderedBasePrinterOrders[0].printerId))
				.limit(1);

			if (selectedPrinter) {
				preferredPrinter = {
					...selectedPrinter,
					clayPrice: selectedPrinter.clayPrice || 40,
					discountAmount: 0
				};

				const printerUpgrades = await db
					.select({
						id: printer.id,
						name: printer.name,
						description: printer.description,
						image: printer.image,
						minPrice: printer.minPrice,
						maxPrice: printer.maxPrice,
						minShopScore: printer.minShopScore,
						maxShopScore: printer.maxShopScore,
						minRequiredShopScore: printer.minRequiredShopScore,
						requiresId: printer.requiresId
					})
					.from(printer)
					.where(
						and(
							eq(printer.deleted, false),
							eq(printer.isPublic, true),
							eq(printer.requiresId, selectedPrinter.id)
						)
					)
					.orderBy(printer.maxPrice);

				const shopScore = locals.user.shopScore;

				upgrades = printerUpgrades
					.map((item) => {
						const computedPrice = calculateMarketPrice(
							item.minPrice,
							item.maxPrice,
							item.minShopScore,
							item.maxShopScore,
							shopScore
						);

						const discountAmount = 1 - computedPrice / item.maxPrice;
						return { ...item, computedPrice, discountAmount };
					})
					.sort((a, b) => a.computedPrice - b.computedPrice);
			}
		}
	} else if (locals.user.preferredBasePrinterId) {
		const [selectedPrinter] = await db
			.select()
			.from(printer)
			.where(eq(printer.id, locals.user.preferredBasePrinterId))
			.limit(1);

		if (selectedPrinter) {
			preferredPrinter = {
				...selectedPrinter,
				clayPrice: selectedPrinter.clayPrice || 40,
				discountAmount: 0
			};

			const printerUpgrades = await db
				.select({
					id: printer.id,
					name: printer.name,
					description: printer.description,
					image: printer.image,
					minPrice: printer.minPrice,
					maxPrice: printer.maxPrice,
					minShopScore: printer.minShopScore,
					maxShopScore: printer.maxShopScore,
					minRequiredShopScore: printer.minRequiredShopScore,
					requiresId: printer.requiresId
				})
				.from(printer)
				.where(
					and(
						eq(printer.deleted, false),
						eq(printer.isPublic, true),
						eq(printer.requiresId, locals.user.preferredBasePrinterId)
					)
				)
				.orderBy(printer.maxPrice);

			const shopScore = locals.user.shopScore;

			upgrades = printerUpgrades
				.map((item) => {
					const computedPrice = calculateMarketPrice(
						item.minPrice,
						item.maxPrice,
						item.minShopScore,
						item.maxShopScore,
						shopScore
					);

					const discountAmount = 1 - computedPrice / item.maxPrice;
					return { ...item, computedPrice, discountAmount };
				})
				.sort((a, b) => a.computedPrice - b.computedPrice);
		}
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
		basePrinters: basePrintersWithPrice,
		preferredPrinter,
		upgrades,
		hasOrderedBasePrinter,
		addresses,
		userDataError
	};
}

export const actions = {
	selectPrinter: async ({ locals, request }) => {
		if (!locals.user) {
			throw error(500);
		}

		const data = await request.formData();
		const printerIdStr = data.get('printerId')?.toString() || '';

		if (printerIdStr === '') {
			await db
				.update(user)
				.set({
					preferredBasePrinterId: null
				})
				.where(eq(user.id, locals.user.id));

			return redirect(303, '/dashboard/market/printer');
		}

		const printerId = parseInt(printerIdStr);

		if (isNaN(printerId)) {
			throw error(400, { message: 'Invalid printer ID' });
		}

		const [selectedPrinter] = await db
			.select()
			.from(printer)
			.where(
				and(
					eq(printer.id, printerId),
					eq(printer.deleted, false),
					eq(printer.isPublic, true),
					isNull(printer.requiresId)
				)
			)
			.limit(1);

		if (!selectedPrinter) {
			throw error(404, { message: 'Printer not found' });
		}

		await db
			.update(user)
			.set({
				preferredBasePrinterId: printerId
			})
			.where(eq(user.id, locals.user.id));

		return redirect(303, '/dashboard/market/printer');
	},

	lockIn: async ({ locals, request }) => {
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
	},

	checkout: async ({ locals, request }) => {
		if (!locals.user) {
			throw error(500);
		}

		const data = await request.formData();
		const baseId = data.get('baseId')?.toString();
		const upgradeIdsStr = data.get('upgradeIds')?.toString();

		if (!baseId) {
			throw error(400, { message: 'No base printer selected' });
		}

		let upgradeIds: number[] = [];
		try {
			upgradeIds = JSON.parse(upgradeIdsStr || '[]');
		} catch {
			throw error(400, { message: 'Invalid upgrade ids' });
		}

		// Validate items
		const [basePrinter] = await db
			.select()
			.from(printer)
			.where(and(eq(printer.deleted, false), eq(printer.isPublic, true), eq(printer.id, parseInt(baseId))))
			.limit(1);

		if (!basePrinter) {
			throw error(404, { message: 'Base printer not found' });
		}

		for (const id of upgradeIds) {
			const [upgrade] = await db
				.select()
				.from(printer)
				.where(
					and(
						eq(printer.deleted, false),
						eq(printer.isPublic, true),
						eq(printer.id, id),
						eq(printer.requiresId, parseInt(baseId))
					)
				)
				.limit(1);

			if (!upgrade) {
				throw error(404, { message: 'Upgrade not found' });
			}
		}

		// Redirect to checkout page with params
		const params = new URLSearchParams();
		params.set('base', baseId);
		params.set('upgrades', upgradeIdsStr || '[]');

		return redirect(302, `/dashboard/market/printer/checkout?${params.toString()}`);
	}
} satisfies Actions;
