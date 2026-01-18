import { db } from '$lib/server/db/index.js';
import { printer, user, printerOrder } from '$lib/server/db/schema.js';
import { calculateMarketPrice } from '$lib/utils';
import { error, redirect } from '@sveltejs/kit';
import { eq, and, isNull, isNotNull, or } from 'drizzle-orm';
import type { Actions } from './$types';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
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

	return {
		basePrinters: basePrintersWithPrice,
		preferredPrinter,
		upgrades,
		hasOrderedBasePrinter
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
	}
} satisfies Actions;
