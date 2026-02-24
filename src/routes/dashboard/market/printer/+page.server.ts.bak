import { getPrinterFromPath, getPurchaseablePrinters } from '$lib/printers.js';
import { db } from '$lib/server/db';
import { printerOrder, user } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { BASE_PRINTER_CLAY } from '$lib/defs';
import type { Actions } from './$types';
import { calculateMarketPrice } from '$lib/utils';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}

	const printerOrders = await db
		.select({
			printer: printerOrder.printer
		})
		.from(printerOrder)
		.where(eq(printerOrder.userId, locals.user.id));

	return {
		purchasedPrinters: printerOrders.map((order) => order.printer.path)
	};
}

export const actions = {
	order: async ({ locals, request }) => {
		if (!locals.user) {
			throw error(500);
		}

		const data = await request.formData();
		const unparsedPath = data.get('printerPath')?.toString();
		const { path: printerPath }: { path: number[] | undefined } =
			unparsedPath != undefined ? JSON.parse(unparsedPath) : { printerPath: undefined };

		if (!printerPath || !Array.isArray(printerPath) || printerPath.length === 0) {
			throw error(400, { message: 'bad printer path' });
		}

		const purchaseablePrinters = getPurchaseablePrinters(locals.user.printer.path);
		const isPurchaseable = purchaseablePrinters.some(
			(arr) =>
				arr.length === printerPath.length &&
				arr.every((value, index) => value === printerPath[index])
		);

		if (!isPurchaseable) {
			throw error(400, { message: 'printer not purchaseable' });
		}

		const printer = getPrinterFromPath(printerPath);

		const printerOrders = await db
			.select({
				printer: printerOrder.printer
			})
			.from(printerOrder)
			.where(eq(printerOrder.userId, locals.user.id));
		const purchasedPrinters = printerOrders.map((order) => order.printer.path);
		const alreadyPurchased = purchasedPrinters.some(
					(arr: number[]) =>
						arr.length === printerPath.length &&
						arr.every((value, index) => value === printerPath[index])
				)

		if (printer.singlePurchase && alreadyPurchased) {
			throw error(400, { message: "already purchased" });
		}

		if (printer.isBasePrinter) {
			if (locals.user.clay < BASE_PRINTER_CLAY) {
				throw error(400, { message: "can't afford" });
			}

			await db
				.update(user)
				.set({
					clay: locals.user.clay - BASE_PRINTER_CLAY,
					printer: { path: printerPath },
					hasBasePrinter: true
				})
				.where(eq(user.id, locals.user.id));

			await db.insert(printerOrder).values({
				userId: locals.user.id,
				printer: { path: printerPath },
				clayPaid: BASE_PRINTER_CLAY
			});
		} else {
			const price = calculateMarketPrice(
				printer.minBrick ?? 0,
				printer.maxBrick ?? 0,
				printer.minShopScore ?? 0,
				printer.maxShopScore ?? 0,
				locals.user.shopScore
			);

			if (locals.user.brick < price) {
				throw error(400, { message: "can't afford" });
			}

			await db
				.update(user)
				.set({
					brick: locals.user.brick - price,
					printer: { path: printer.singlePurchase ? printerPath : locals.user.printer.path }
				})
				.where(eq(user.id, locals.user.id));

			await db.insert(printerOrder).values({
				userId: locals.user.id,
				printer: { path: printerPath },
				bricksPaid: price
			});
		}

		return { success: true };
	}
} satisfies Actions;
