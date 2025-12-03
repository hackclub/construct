import { db } from '$lib/server/db/index.js';
import { user, devlog, session } from '$lib/server/db/schema.js';
import { error, fail } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';
import type { Actions } from './$types';

export async function load({ locals, params }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'get out, peasant' });
	}

	const id: number = parseInt(params.id);

	const [queriedUser] = await db.select().from(user).where(eq(user.id, id));
	const [{ devlogCount }] = (await db
		.select({
			devlogCount: sql`COALESCE(COUNT(${devlog.id}), 0)`
		})
		.from(user)
		.leftJoin(devlog, and(eq(devlog.userId, user.id), eq(devlog.deleted, false)))
		.where(eq(user.id, id))
		.groupBy(user.id)) ?? [{ devlogCount: 0 }];

	if (!queriedUser) {
		throw error(404, { message: 'user not found' });
	}

	return {
		queriedUser,
		devlogCount
	};
}

export const actions = {
	privileges: async ({ locals, request, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'get out, peasant' });
		}

		const id: number = parseInt(params.id);

		const data = await request.formData();
		const hasT1Review = data.get('has_t1_review');
		const hasT2Review = data.get('has_t2_review');
		const hasAdmin = data.get('has_admin');
		const hasProjectAuditLogs = data.get('has_project_audit_logs');

		await db
			.update(user)
			.set({
				hasT1Review: hasT1Review === 'on',
				hasT2Review: hasT2Review === 'on',
				hasAdmin: hasAdmin === 'on',
				hasProjectAuditLogs: hasProjectAuditLogs === 'on'
			})
			.where(eq(user.id, id));

		const [queriedUser] = await db.select().from(user).where(eq(user.id, id));

		if (!queriedUser) {
			throw error(404, { message: 'user not found' });
		}

		return {
			queriedUser
		};
	},

	currency: async ({ locals, request, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'get out, peasant' });
		}

		const id: number = parseInt(params.id);

		const data = await request.formData();
		const clay = data.get('clay');
		const brick = data.get('brick');
		const shopScore = data.get('market_score');

		if (
			!clay ||
			isNaN(parseFloat(clay.toString())) ||
			!brick ||
			isNaN(parseFloat(brick.toString())) ||
			!shopScore ||
			isNaN(parseFloat(shopScore.toString()))
		) {
			return fail(400, {
				currency: {
					fields: { clay, brick, shopScore },
					invalidFields: true
				}
			});
		}

		await db
			.update(user)
			.set({
				clay: parseFloat(clay.toString()),
				brick: parseFloat(brick.toString()),
				shopScore: parseFloat(shopScore.toString())
			})
			.where(eq(user.id, id));

		const [queriedUser] = await db.select().from(user).where(eq(user.id, id));

		if (!queriedUser) {
			throw error(404, { message: 'user not found' });
		}

		return {
			queriedUser
		};
	},

	refreshHackatime: async ({ locals, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'get out, peasant' });
		}

		const id: number = parseInt(params.id);

		const [oldQueriedUser] = await db
			.select({
				slackId: user.slackId
			})
			.from(user)
			.where(eq(user.id, id));

		if (!oldQueriedUser) {
			throw error(404, { message: 'user not found' });
		}

		const hackatimeTrust = (
			await (
				await fetch(
					`https://hackatime.hackclub.com/api/v1/users/${oldQueriedUser.slackId}/trust_factor`
				)
			).json()
		)['trust_level'];

		if (!hackatimeTrust) {
			return error(418, {
				message: 'failed to fetch hackatime trust factor, please try again later'
			});
		}

		// Log out user
		if (hackatimeTrust === 'red') {
			await db.delete(session).where(eq(session.userId, id));
		}

		await db
			.update(user)
			.set({
				hackatimeTrust
			})
			.where(eq(user.id, id));

		const [queriedUser] = await db.select().from(user).where(eq(user.id, id));

		if (!queriedUser) {
			throw error(404, { message: 'user not found' });
		}

		return {
			queriedUser
		};
	},

	logout: async ({ locals, params }) => {
		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'get out, peasant' });
		}

		const id: number = parseInt(params.id);

		// Log out user
		await db.delete(session).where(eq(session.userId, id));

		const [queriedUser] = await db.select().from(user).where(eq(user.id, id));

		if (!queriedUser) {
			throw error(404, { message: 'user not found' });
		}

		return {
			queriedUser
		};
	}
} satisfies Actions;
