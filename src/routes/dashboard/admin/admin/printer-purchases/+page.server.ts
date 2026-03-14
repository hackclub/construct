import { db } from '$lib/server/db/index.js';
import { printerOrder, user } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, inArray, desc } from 'drizzle-orm';
import type { Actions } from './$types';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const orders = await getOrders([]);

	const users = await db
		.select({
			id: user.id,
			name: user.name
		})
		.from(user);

	return {
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

		const userFilter = data.getAll('user').map((userId) => {
			const parsedInt = parseInt(userId.toString());
			if (!parsedInt) throw error(400, { message: 'malformed user filter' });
			return parsedInt;
		});

		const orders = await getOrders(userFilter);

		return {
			orders,
			fields: {
				user: userFilter
			}
		};
	}
} satisfies Actions;

async function getOrders(userFilter: number[]) {
	return await db
		.select({
			order: {
				id: printerOrder.id,
				userId: printerOrder.userId,
				printer: printerOrder.printer,
				clayPaid: printerOrder.clayPaid,
				bricksPaid: printerOrder.bricksPaid,
				timestamp: printerOrder.timestamp
			},
			user: {
				id: user.id,
				name: user.name
			}
		})
		.from(printerOrder)
		.leftJoin(user, eq(user.id, printerOrder.userId))
		.where(userFilter.length > 0 ? inArray(printerOrder.userId, userFilter) : undefined)
		.orderBy(desc(printerOrder.timestamp));
}
