import { db } from '$lib/server/db/index.js';
import { marketItemOrder, marketItem, printerOrder, printer, user } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, and, ne, inArray, desc, sql } from 'drizzle-orm';
import type { Actions } from './$types';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const orders = await getOrders(['awaiting_approval'], [], [], []);

	const allMarketItems = await db
		.select({
			id: marketItem.id,
			name: marketItem.name
		})
		.from(marketItem)
		.where(eq(marketItem.deleted, false));

	const allPrinters = await db
		.select({
			id: printer.id,
			name: printer.name
		})
		.from(printer)
		.where(eq(printer.deleted, false));

	const users = await db
		.select({
			id: user.id,
			name: user.name
		})
		.from(user)
		.where(and(ne(user.trust, 'red'), ne(user.hackatimeTrust, 'red'))); // hide banned users

	return {
		allMarketItems,
		allPrinters,
		orders,
		users
	};
}

export const actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const data = await request.formData();
		const statusFilter = data.getAll('status') as (typeof marketItemOrder.status._.data)[];

		const marketItemFilter = data.getAll('marketItem').map((itemId) => {
			const parsedInt = parseInt(itemId.toString());
			if (!parsedInt) throw error(400, { message: 'malformed market item filter' });
			return parsedInt;
		});

		const printerFilter = data.getAll('printer').map((itemId) => {
			const parsedInt = parseInt(itemId.toString());
			if (!parsedInt) throw error(400, { message: 'malformed printer filter' });
			return parsedInt;
		});

		const userFilter = data.getAll('user').map((userId) => {
			const parsedInt = parseInt(userId.toString());
			if (!parsedInt) throw error(400, { message: 'malformed user filter' });
			return parsedInt;
		});

		const orders = await getOrders(statusFilter, marketItemFilter, printerFilter, userFilter);

		return {
			orders,
			fields: {
				status: statusFilter,
				marketItem: marketItemFilter,
				printer: printerFilter,
				user: userFilter
			}
		};
	}
} satisfies Actions;

async function getOrders(
	statusFilter: (typeof marketItemOrder.status._.data)[],
	marketItemFilter: number[],
	printerFilter: number[],
	userFilter: number[]
) {
	const marketItemOrders = await db
		.select({
			id: marketItemOrder.id,
			userId: marketItemOrder.userId,
			marketItemId: marketItemOrder.marketItemId,
			addressId: marketItemOrder.addressId,
			bricksPaid: marketItemOrder.bricksPaid,
			status: marketItemOrder.status,
			userNotes: marketItemOrder.userNotes,
			notes: marketItemOrder.notes,
			createdAt: marketItemOrder.createdAt,
			itemId: marketItem.id,
			itemName: marketItem.name,
			itemImage: marketItem.image,
			userName: user.name,
			userIdvToken: user.idvToken
		})
		.from(marketItemOrder)
		.leftJoin(marketItem, eq(marketItem.id, marketItemOrder.marketItemId))
		.leftJoin(user, eq(user.id, marketItemOrder.userId))
		.where(
			and(
				eq(marketItemOrder.deleted, false),
				statusFilter.length > 0 ? inArray(marketItemOrder.status, statusFilter) : undefined,
				marketItemFilter.length > 0
					? inArray(marketItemOrder.marketItemId, marketItemFilter)
					: undefined,
				userFilter.length > 0 ? inArray(marketItemOrder.userId, userFilter) : undefined
			)
		);

	const printerOrders = await db
		.select({
			id: printerOrder.id,
			userId: printerOrder.userId,
			printerId: printerOrder.printerId,
			addressId: printerOrder.addressId,
			bricksPaid: printerOrder.bricksPaid,
			status: printerOrder.status,
			userNotes: printerOrder.userNotes,
			notes: printerOrder.notes,
			createdAt: printerOrder.createdAt,
			itemId: printer.id,
			itemName: printer.name,
			itemImage: printer.image,
			userName: user.name,
			userIdvToken: user.idvToken
		})
		.from(printerOrder)
		.leftJoin(printer, eq(printer.id, printerOrder.printerId))
		.leftJoin(user, eq(user.id, printerOrder.userId))
		.where(
			and(
				eq(printerOrder.deleted, false),
				statusFilter.length > 0 ? inArray(printerOrder.status, statusFilter) : undefined,
				printerFilter.length > 0
					? inArray(printerOrder.printerId, printerFilter)
					: undefined,
				userFilter.length > 0 ? inArray(printerOrder.userId, userFilter) : undefined
			)
		);

	const combined = [
		...marketItemOrders.map(o => ({
			order: {
				id: o.id,
				userId: o.userId,
				marketItemId: o.marketItemId,
				printerId: null,
				addressId: o.addressId,
				bricksPaid: o.bricksPaid,
				status: o.status,
				userNotes: o.userNotes,
				notes: o.notes,
				createdAt: o.createdAt,
				type: 'marketItem' as const
			},
			item: {
				id: o.itemId,
				name: o.itemName,
				image: o.itemImage
			},
			user: {
				id: o.userId,
				name: o.userName,
				idvToken: o.userIdvToken
			}
		})),
		...printerOrders.map(o => ({
			order: {
				id: o.id,
				userId: o.userId,
				marketItemId: null,
				printerId: o.printerId,
				addressId: o.addressId,
				bricksPaid: o.bricksPaid,
				status: o.status,
				userNotes: o.userNotes,
				notes: o.notes,
				createdAt: o.createdAt,
				type: 'printer' as const
			},
			item: {
				id: o.itemId,
				name: o.itemName,
				image: o.itemImage
			},
			user: {
				id: o.userId,
				name: o.userName,
				idvToken: o.userIdvToken
			}
		}))
	].sort((a, b) => new Date(b.order.createdAt).getTime() - new Date(a.order.createdAt).getTime());

	return combined;
}
