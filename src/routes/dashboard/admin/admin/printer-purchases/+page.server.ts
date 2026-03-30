import { db } from '$lib/server/db/index.js';
import { printerOrder, user } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, inArray, desc } from 'drizzle-orm';

export async function load({ locals, url }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const userFilter = url.searchParams
		.getAll('user')
		.map((id) => parseInt(id))
		.filter((id) => !isNaN(id) && id > 0);

	const orders = await getOrders(userFilter);

	const users = await db
		.select({
			id: user.id,
			name: user.name
		})
		.from(user);

	return {
		orders,
		users,
		fields: {
			user: userFilter
		}
	};
}

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
