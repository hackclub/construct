import { db } from '$lib/server/db/index.js';
import { user } from '$lib/server/db/schema.js';
import { error, redirect } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import type { Actions } from './$types';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}

	if (locals.user.printerFulfilment !== 'none' || !locals.user.hasBasePrinter) {
		return redirect(303, '/dashboard/market/printer');
	}
}

export const actions = {
	default: async ({ locals }) => {
		if (!locals.user) {
			throw error(500);
		}

		if (locals.user.printerFulfilment !== 'none' || !locals.user.hasBasePrinter) {
			return redirect(303, '/dashboard/market/printer');
		}

		await db
			.update(user)
			.set({
				printerFulfilment: 'queued'
			})
			.where(and(eq(user.id, locals.user.id), eq(user.printerFulfilment, 'none')));

		return redirect(303, '/dashboard/market/printer');
	}
} satisfies Actions;
