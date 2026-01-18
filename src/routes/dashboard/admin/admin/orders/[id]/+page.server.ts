import { db } from '$lib/server/db/index.js';
import { marketItemOrder, marketItem, user, printerOrder, printer } from '$lib/server/db/schema.js';
import { error, redirect } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { Actions } from './$types';
import { sendSlackDM } from '$lib/server/slack.js';
import { decrypt } from '$lib/server/encryption';
import { getUserData } from '$lib/server/idvUserData';
import { calculateMarketPrice } from '$lib/utils';
import { env } from '$env/dynamic/private';

export async function load({ locals, params }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const id: number = parseInt(params.id);

	const [orderData] = await db
		.select({
			order: {
				id: marketItemOrder.id,
				userId: marketItemOrder.userId,
				marketItemId: marketItemOrder.marketItemId,
				printerId: sql<number>`null`.as('printerId'),
				addressId: marketItemOrder.addressId,
				bricksPaid: marketItemOrder.bricksPaid,
				status: marketItemOrder.status,
				userNotes: marketItemOrder.userNotes,
				notes: marketItemOrder.notes,
				createdAt: marketItemOrder.createdAt
			},
			marketItem: {
				id: marketItem.id,
				name: marketItem.name,
				description: marketItem.description,
				image: marketItem.image
			},
			printer: sql`null`.as('printer'),
			user: {
				id: user.id,
				name: user.name,
				slackId: user.slackId,
				idvToken: user.idvToken,
				brick: user.brick,
				shopScore: user.shopScore
			},
			type: sql`'marketItem'`.as('type')
		})
		.from(marketItemOrder)
		.leftJoin(marketItem, eq(marketItem.id, marketItemOrder.marketItemId))
		.leftJoin(user, eq(user.id, marketItemOrder.userId))
		.where(and(eq(marketItemOrder.id, id), eq(marketItemOrder.deleted, false)))
		.limit(1);

	let orderDataFinal = orderData;

	if (!orderData) {
		const [printerOrderData] = await db
			.select({
				order: {
					id: printerOrder.id,
					userId: printerOrder.userId,
					marketItemId: sql<number>`null`.as('marketItemId'),
					printerId: printerOrder.printerId,
					addressId: printerOrder.addressId,
					bricksPaid: printerOrder.bricksPaid,
					status: printerOrder.status,
					userNotes: printerOrder.userNotes,
					notes: printerOrder.notes,
					createdAt: printerOrder.createdAt
				},
				marketItem: sql`null`.as('marketItem'),
				printer: {
					id: printer.id,
					name: printer.name,
					description: printer.description,
					image: printer.image,
					clayPrice: printer.clayPrice
				},
				user: {
					id: user.id,
					name: user.name,
					slackId: user.slackId,
					idvToken: user.idvToken,
					brick: user.brick,
					shopScore: user.shopScore
				},
				type: sql`'printer'`.as('type')
			})
			.from(printerOrder)
			.leftJoin(printer, eq(printer.id, printerOrder.printerId))
			.leftJoin(user, eq(user.id, printerOrder.userId))
			.where(and(eq(printerOrder.id, id), eq(printerOrder.deleted, false)))
			.limit(1);

		orderDataFinal = printerOrderData;
	}

	if (!orderDataFinal) {
		throw error(404, { message: 'order not found' });
	}

	let address = null;
	let userDataError = false;

	if (orderDataFinal.user?.idvToken) {
		try {
			const token = decrypt(orderDataFinal.user.idvToken);
			const userData = await getUserData(token);
			address = userData?.addresses?.find(
				(a: { id: string }) => a.id === orderDataFinal.order.addressId
			);
		} catch {
			userDataError = true;
		}
	} else {
		userDataError = true;
	}

	let selectedUpgrades = [];
	if (orderDataFinal.type === 'printer') {
		const userNotes = orderDataFinal.order.userNotes || '';
		const parts = userNotes.split('\n\nUpgrades: ');
		if (parts.length > 1) {
			orderDataFinal.order.userNotes = parts[0];
			const upgradeNamesStr = parts[1];
			const upgradeNames = upgradeNamesStr.split(', ');
			for (const name of upgradeNames) {
				const [upgrade] = await db
					.select()
					.from(printer)
					.where(
						and(
							eq(printer.name, name),
							eq(printer.requiresId, orderDataFinal.order.printerId),
							eq(printer.deleted, false)
						)
					)
					.limit(1);
				if (upgrade) {
					const computedPrice = calculateMarketPrice(
						upgrade.minPrice,
						upgrade.maxPrice,
						upgrade.minShopScore,
						upgrade.maxShopScore,
						orderDataFinal.user?.shopScore || 0
					);
					selectedUpgrades.push({ ...upgrade, computedPrice });
				}
			}
		}
	}

	orderDataFinal.selectedUpgrades = selectedUpgrades;

	return {
		orderData: orderDataFinal,
		address,
		userDataError,
		s3PublicUrl: env.S3_PUBLIC_URL
	};
}

export const actions = {
	markShipped: async ({ locals, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		let orderData = null;
		let itemName = '';
		let userSlackId = '';

		// Try market item
		const [marketOrder] = await db
			.select({
				order: {
					id: marketItemOrder.id,
					notes: marketItemOrder.notes
				},
				marketItem: {
					name: marketItem.name
				},
				user: {
					id: user.id,
					slackId: user.slackId
				}
			})
			.from(marketItemOrder)
			.leftJoin(marketItem, eq(marketItem.id, marketItemOrder.marketItemId))
			.leftJoin(user, eq(user.id, marketItemOrder.userId))
			.where(
				and(
					eq(marketItemOrder.id, id),
					eq(marketItemOrder.deleted, false),
					eq(marketItemOrder.status, 'awaiting_approval')
				)
			)
			.limit(1);

		if (marketOrder) {
			orderData = marketOrder.order;
			itemName = marketOrder.marketItem?.name || 'Market item';
			userSlackId = marketOrder.user?.slackId || '';
		} else {
			const [printerOrderData] = await db
				.select({
					order: {
						id: printerOrder.id,
						notes: printerOrder.notes
					},
					printer: {
						name: printer.name
					},
					user: {
						id: user.id,
						slackId: user.slackId
					}
				})
				.from(printerOrder)
				.leftJoin(printer, eq(printer.id, printerOrder.printerId))
				.leftJoin(user, eq(user.id, printerOrder.userId))
				.where(
					and(
						eq(printerOrder.id, id),
						eq(printerOrder.deleted, false),
						eq(printerOrder.status, 'awaiting_approval')
					)
				)
				.limit(1);

			if (printerOrderData) {
				orderData = printerOrderData.order;
				itemName = printerOrderData.printer?.name || 'Printer';
				userSlackId = printerOrderData.user?.slackId || '';
			}
		}

		if (!orderData) {
			throw error(404, { message: 'order not found' });
		}

		if (marketOrder) {
			await db
				.update(marketItemOrder)
				.set({
					status: 'fulfilled'
				})
				.where(eq(marketItemOrder.id, id));
		} else {
			await db
				.update(printerOrder)
				.set({
					status: 'fulfilled',
					notes: ''
				})
				.where(eq(printerOrder.id, id));
		}

		if (userSlackId) {
			const notesText = orderData.notes ? `\n\nNotes: ${orderData.notes}` : '';
			await sendSlackDM(
				userSlackId,
				`Your order for ${itemName} just got shipped! :package: :package: :package:\n\n${notesText}`
			);
		}

		return { success: true, message: 'Order marked as shipped' };
	},

	refund: async ({ locals, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		// Check if it's a market item order
		const [marketOrderData] = await db
			.select({
				order: {
					id: marketItemOrder.id,
					userId: marketItemOrder.userId,
					bricksPaid: marketItemOrder.bricksPaid
				},
				marketItem: {
					name: marketItem.name
				},
				user: {
					id: user.id,
					slackId: user.slackId,
					brick: user.brick
				}
			})
			.from(marketItemOrder)
			.leftJoin(marketItem, eq(marketItem.id, marketItemOrder.marketItemId))
			.leftJoin(user, eq(user.id, marketItemOrder.userId))
			.where(
				and(
					eq(marketItemOrder.id, id),
					eq(marketItemOrder.deleted, false),
					eq(marketItemOrder.status, 'awaiting_approval')
				)
			)
			.limit(1);

		if (marketOrderData) {
			// Refund market item order
			await db
				.update(user)
				.set({
					brick: marketOrderData.user!.brick + marketOrderData.order.bricksPaid
				})
				.where(eq(user.id, marketOrderData.order.userId));

			await db
				.update(marketItemOrder)
				.set({
					status: 'refunded'
				})
				.where(eq(marketItemOrder.id, id));

			if (marketOrderData.user?.slackId) {
				await sendSlackDM(
					marketOrderData.user.slackId,
					`Your order for ${marketOrderData.marketItem?.name || 'a market item'} has been refunded! :oop:\nYou got your ${marketOrderData.order.bricksPaid} bricks back`
				);
			}

			return { success: true, message: 'Order refunded' };
		}

		// Check if it's a printer order
		const [printerOrderData] = await db
			.select({
				order: {
					id: printerOrder.id,
					userId: printerOrder.userId,
					printerId: printerOrder.printerId,
					bricksPaid: printerOrder.bricksPaid,
					notes: printerOrder.notes
				},
				printer: {
					name: printer.name,
					clayPrice: printer.clayPrice
				},
				user: {
					id: user.id,
					slackId: user.slackId,
					brick: user.brick,
					clay: user.clay
				}
			})
			.from(printerOrder)
			.leftJoin(printer, eq(printer.id, printerOrder.printerId))
			.leftJoin(user, eq(user.id, printerOrder.userId))
			.where(
				and(
					eq(printerOrder.id, id),
					eq(printerOrder.deleted, false),
					eq(printerOrder.status, 'awaiting_approval')
				)
			)
			.limit(1);

		if (printerOrderData) {
			// Refund printer order
			const clayRefund = printerOrderData.printer?.clayPrice || 40;
			let upgradeText = '';
			if (printerOrderData.order.notes && printerOrderData.order.notes.startsWith('Upgrades: ')) {
				const upgradeNamesStr = printerOrderData.order.notes.substring('Upgrades: '.length);
				upgradeText = ` with upgrades: ${upgradeNamesStr}`;
			}
			await db
				.update(user)
				.set({
					clay: printerOrderData.user!.clay + clayRefund,
					brick: printerOrderData.user!.brick + printerOrderData.order.bricksPaid,
					hasBasePrinter: false,
					preferredBasePrinterId: null
				})
				.where(eq(user.id, printerOrderData.order.userId));

			await db
				.update(printerOrder)
				.set({
					status: 'refunded',
					notes: ''
				})
				.where(eq(printerOrder.id, id));

			if (printerOrderData.user?.slackId) {
				await sendSlackDM(
					printerOrderData.user.slackId,
					`Your order for ${printerOrderData.printer?.name || 'a printer'}${upgradeText} has been refunded! :oop:\nYou got your ${clayRefund} clay and ${printerOrderData.order.bricksPaid} bricks back`
				);
			}

			return { success: true, message: 'Order refunded' };
		}

		throw error(404, { message: 'order not found' });
	},

	deny: async ({ locals, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const [orderData] = await db
			.select({
				order: {
					id: marketItemOrder.id
				},
				marketItem: {
					name: marketItem.name
				},
				user: {
					slackId: user.slackId
				}
			})
			.from(marketItemOrder)
			.leftJoin(marketItem, eq(marketItem.id, marketItemOrder.marketItemId))
			.leftJoin(user, eq(user.id, marketItemOrder.userId))
			.where(
				and(
					eq(marketItemOrder.id, id),
					eq(marketItemOrder.deleted, false),
					eq(marketItemOrder.status, 'awaiting_approval')
				)
			)
			.limit(1);

		if (!orderData) {
			throw error(404, { message: 'order not found' });
		}

		// Mark order as denied
		await db
			.update(marketItemOrder)
			.set({
				status: 'denied'
			})
			.where(eq(marketItemOrder.id, id));

		if (orderData.user?.slackId) {
			await sendSlackDM(
				orderData.user.slackId,
				`Your order for ${orderData.marketItem?.name || 'a market item'} has been denied :dcolon:\nYou didn't get any of your bricks back :hmmm:`
			);
		}

		return redirect(302, '/dashboard/admin/admin/orders');
	},

	updateNotes: async ({ locals, params, request }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);
		const data = await request.formData();
		const notes = data.get('notes')?.toString();

		if (notes === undefined) {
			throw error(400, { message: 'missing notes' });
		}

		await db
			.update(marketItemOrder)
			.set({
				notes
			})
			.where(eq(marketItemOrder.id, id));

		return { success: true, message: 'Notes updated' };
	}
} satisfies Actions;
