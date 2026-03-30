import { db } from '$lib/server/db/index.js';
import { marketItemOrder, marketItem, user } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, and, ne, inArray, desc } from 'drizzle-orm';

export async function load({ locals, url }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const hasFilters = url.searchParams.size > 0;
	const statusFilter = hasFilters
		? (url.searchParams.getAll('status') as (typeof marketItemOrder.status._.data)[])
		: (['awaiting_approval'] as (typeof marketItemOrder.status._.data)[]);
	const marketItemFilter = url.searchParams
		.getAll('marketItem')
		.map((id) => parseInt(id))
		.filter((id) => !isNaN(id) && id > 0);
	const userFilter = url.searchParams
		.getAll('user')
		.map((id) => parseInt(id))
		.filter((id) => !isNaN(id) && id > 0);

	const orders = await getOrders(statusFilter, marketItemFilter, userFilter);

	const allMarketItems = await db
		.select({
			id: marketItem.id,
			name: marketItem.name
		})
		.from(marketItem)
		.where(eq(marketItem.deleted, false));

	const users = await db
		.select({
			id: user.id,
			name: user.name
		})
		.from(user)
		.where(and(ne(user.trust, 'red'), ne(user.hackatimeTrust, 'red'))); // hide banned users

	return {
		allMarketItems,
		orders,
		users,
		fields: {
			status: statusFilter,
			marketItem: marketItemFilter,
			user: userFilter
		}
	};
}

async function getOrders(
	statusFilter: (typeof marketItemOrder.status._.data)[],
	marketItemFilter: number[],
	userFilter: number[]
) {
	return await db
		.select({
			order: {
				id: marketItemOrder.id,
				userId: marketItemOrder.userId,
				marketItemId: marketItemOrder.marketItemId,
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
				image: marketItem.image
			},
			user: {
				id: user.id,
				name: user.name,
				idvToken: user.idvToken
			}
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
		)
		.orderBy(desc(marketItemOrder.createdAt));
}
