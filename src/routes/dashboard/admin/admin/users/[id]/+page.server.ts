import { db } from '$lib/server/db/index.js';
import { user, devlog, session, impersonateAuditLog } from '$lib/server/db/schema.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';
import type { Actions } from './$types';
import {
	createSession,
	DAY_IN_MS,
	generateSessionToken,
	SESSION_EXPIRY_DAYS,
	setSessionTokenCookie
} from '$lib/server/auth';
import { decrypt } from '$lib/server/encryption';
import { getUserData } from '$lib/server/idvUserData';

export async function load({ locals, params }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
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
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const data = await request.formData();
		const isPrinter = data.get('is_printer');
		const hasT1Review = data.get('has_t1_review');
		const hasT2Review = data.get('has_t2_review');
		const hasAdmin = data.get('has_admin');

		await db
			.update(user)
			.set({
				isPrinter: isPrinter === 'on',
				hasT1Review: hasT1Review === 'on',
				hasT2Review: hasT2Review === 'on',
				hasAdmin: hasAdmin === 'on'
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
			throw error(403, { message: 'oi get out' });
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
			throw error(403, { message: 'oi get out' });
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
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const [queriedUser] = await db.select().from(user).where(eq(user.id, id));

		if (!queriedUser) {
			throw error(404, { message: 'user not found' });
		}

		// Log out user
		await db.delete(session).where(eq(session.userId, id));

		return {
			queriedUser
		};
	},

	impersonate: async (event) => {
		const { locals, params } = event;

		if (!locals.user) {
			throw error(500);
		}
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const [queriedUser] = await db.select().from(user).where(eq(user.id, id));

		if (!queriedUser) {
			throw error(404, { message: 'user not found' });
		}

		// Log the impersonation
		await db.insert(impersonateAuditLog).values({
			adminUserId: locals.user.id,
			targetUserId: id
		});

		const sessionToken = generateSessionToken();
		await createSession(sessionToken, id);
		setSessionTokenCookie(
			event,
			sessionToken,
			new Date(Date.now() + DAY_IN_MS * SESSION_EXPIRY_DAYS)
		);

		return redirect(302, '/dashboard');
	},

	fetchPII: async (event) => {
		const { locals, params } = event;

		if (!locals.user) {
			throw error(500);
		}

		// Pretty important line
		if (!locals.user.hasAdmin) {
			throw error(403, { message: 'oi get out' });
		}

		const id: number = parseInt(params.id);

		const [queriedUser] = await db
			.select({
				idvToken: user.idvToken
			})
			.from(user)
			.where(eq(user.id, id));

		if (!queriedUser) {
			throw error(404, { message: 'user not found' });
		}

		if (!queriedUser.idvToken) {
			return fail(400, {
				fetchPII: {
					success: false,
					errorMessage: 'IDV token not found, ask them to re-login',
					first_name: null,
					last_name: null,
					primary_email: null,
					phone_number: null,
					birthday: null,
					address: null
				}
			});
		}

		const token = decrypt(queriedUser.idvToken);
		let userData;

		try {
			userData = await getUserData(token);
		} catch {
			return fail(400, {
				fetchPII: {
					success: false,
					errorMessage: 'IDV token revoked/expired, ask them to re-login',
					first_name: null,
					last_name: null,
					primary_email: null,
					phone_number: null,
					birthday: null,
					address: null
				}
			});
		}

		const { first_name, last_name, primary_email, birthday, phone_number, addresses } = userData;

		const address = addresses?.find((address: { primary: boolean }) => address.primary);

		return {
			fetchPII: {
				success: true,
				errorMessage: '',
				first_name,
				last_name,
				primary_email,
				phone_number,
				birthday,
				address
			}
		};
	}
} satisfies Actions;
