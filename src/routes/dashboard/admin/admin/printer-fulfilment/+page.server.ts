import { db } from '$lib/server/db/index.js';
import { user, printerOrder, printerFulfilmentStatus } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, inArray, sql, asc } from 'drizzle-orm';
import type { Actions } from './$types';

type FulfilmentStatus = (typeof printerFulfilmentStatus.enumValues)[number];

async function getUsers(statusFilter: FulfilmentStatus[]) {
	return await db
		.select({
			id: user.id,
			name: user.name,
			slackId: user.slackId,
			printerFulfilment: user.printerFulfilment,
			firstOrderAt: sql<string>`min(${printerOrder.timestamp})`
				.mapWith((val) => new Date(val))
				.as('first_order_at')
		})
		.from(user)
		.leftJoin(printerOrder, eq(printerOrder.userId, user.id))
		.where(statusFilter.length > 0 ? inArray(user.printerFulfilment, statusFilter) : undefined)
		.groupBy(user.id)
		.orderBy(asc(sql`min(${printerOrder.timestamp})`));
}

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const users = await getUsers(['queued']);

	return {
		users,
		fulfilmentStatuses: printerFulfilmentStatus.enumValues
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
		const statusFilter = data.getAll('status') as FulfilmentStatus[];

		const users = await getUsers(statusFilter);

		return {
			users,
			fields: {
				status: statusFilter
			}
		};
	}
} satisfies Actions;
