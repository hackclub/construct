import { db } from '$lib/server/db/index.js';
import { ovenpheusLog, user } from '$lib/server/db/schema.js';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';
import { BRICKS_PER_HOUR, BRICKS_PER_HOUR_CONVERTED, CLAY_PER_HOUR } from '$lib/defs';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}

	return {};
}

export const actions = {
	default: async ({ locals, request }) => {
		if (!locals.user) {
			throw error(500);
		}

		const data = await request.formData();
		const clay = data.get('clay');

		if (
			!clay ||
			!parseInt(clay.toString()) ||
			parseInt(clay.toString()) <= 0 ||
			parseInt(clay.toString()) > locals.user.clay
		) {
			return error(400, { message: 'invalid clay' });
		}

		const parsedClay = parseInt(clay.toString());
		const bricks =
			(parsedClay / CLAY_PER_HOUR) *
			(locals.user.hasBasePrinter ? BRICKS_PER_HOUR : BRICKS_PER_HOUR_CONVERTED);

		await db
			.update(user)
			.set({
				clay: locals.user.clay - parsedClay,
				brick: locals.user.brick + bricks
			})
			.where(eq(user.id, locals.user.id));

		await db.insert(ovenpheusLog).values({
			userId: locals.user.id,
			clay: parsedClay,
			bricksReceived: bricks
		});

		return redirect(302, '/dashboard/market');
	}
} satisfies Actions;
