import { db } from '$lib/server/db/index.js';
import { marketItemOrder, marketItem, user } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, and, ne, inArray, desc } from 'drizzle-orm';
import type { Actions } from './$types';
import { decrypt } from '$lib/server/encryption';
import { getUserData } from '$lib/server/idvUserData';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const orders = await getOrders([], [], [], []);

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

	// Get unique countries from orders
	const ordersWithAddresses = await db
		.select({
			userId: marketItemOrder.userId,
			addressId: marketItemOrder.addressId
		})
		.from(marketItemOrder)
		.where(eq(marketItemOrder.deleted, false));

	const countries: string[] = [];
	for (const order of ordersWithAddresses) {
		try {
			const orderUser = await db
				.select({
					idvToken: user.idvToken
				})
				.from(user)
				.where(eq(user.id, order.userId))
				.limit(1);

			if (orderUser[0]?.idvToken) {
				const token = decrypt(orderUser[0].idvToken);
				const userData = await getUserData(token);
				const address = userData?.addresses?.find((a: { id: string }) => a.id === order.addressId);
				if (address?.country && !countries.includes(address.country)) {
					countries.push(address.country);
				}
			}
		} catch {
			// Skip if we can't fetch address
		}
	}

	return {
		allMarketItems,
		orders,
		users,
		countries: countries.sort()
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

		const userFilter = data.getAll('user').map((userId) => {
			const parsedInt = parseInt(userId.toString());
			if (!parsedInt) throw error(400, { message: 'malformed user filter' });
			return parsedInt;
		});

		const countryFilter = data.getAll('country') as string[];

		const orders = await getOrders(statusFilter, marketItemFilter, userFilter, countryFilter);

		return {
			orders,
			fields: {
				status: statusFilter,
				marketItem: marketItemFilter,
				user: userFilter,
				country: countryFilter
			}
		};
	}
} satisfies Actions;

async function getOrders(
	statusFilter: (typeof marketItemOrder.status._.data)[],
	marketItemFilter: number[],
	userFilter: number[],
	countryFilter: string[]
) {
	const baseOrders = await db
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
				marketItemFilter.length > 0 ? inArray(marketItemOrder.marketItemId, marketItemFilter) : undefined,
				userFilter.length > 0 ? inArray(marketItemOrder.userId, userFilter) : undefined
			)
		)
		.orderBy(desc(marketItemOrder.createdAt));

	// Filter by country if needed
	if (countryFilter.length > 0) {
		const filteredOrders = [];
		for (const orderData of baseOrders) {
			try {
				if (orderData.user?.idvToken) {
					const token = decrypt(orderData.user.idvToken);
					const userData = await getUserData(token);
					const address = userData?.addresses?.find((a: { id: string }) => a.id === orderData.order.addressId);
					if (address?.country && countryFilter.includes(address.country)) {
						filteredOrders.push(orderData);
					}
				}
			} catch {
				// Skip if we can't fetch address
			}
		}
		return filteredOrders;
	}

	return baseOrders;
}
