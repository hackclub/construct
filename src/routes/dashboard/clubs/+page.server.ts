import { db } from '$lib/server/db/index.js';
import { club, clubMembership, user, devlog, ship } from '$lib/server/db/schema.js';
import { error, fail } from '@sveltejs/kit';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { getLeaderClub } from '$lib/server/clubs-api.js';
import type { Actions } from './$types';
import crypto from 'crypto';

function generateJoinCode(): string {
	return crypto.randomBytes(3).toString('hex').toUpperCase();
}

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}

	// Check if user has a club membership
	const membership = await db
		.select({
			id: clubMembership.id,
			role: clubMembership.role,
			clubId: clubMembership.clubId,
			clubName: club.name,
			joinCode: club.joinCode
		})
		.from(clubMembership)
		.innerJoin(club, eq(clubMembership.clubId, club.id))
		.where(eq(clubMembership.userId, locals.user.id))
		.limit(1);

	if (membership.length === 0) {
		return { linked: false };
	}

	const userMembership = membership[0];

	if (userMembership.role != 'leader') {
		userMembership.joinCode = null;
	}

	// Get all members of this club
	const members = await db
		.select({
			id: user.id,
			name: user.name,
			profilePicture: user.profilePicture,
			role: clubMembership.role
		})
		.from(clubMembership)
		.innerJoin(user, eq(clubMembership.userId, user.id))
		.where(eq(clubMembership.clubId, userMembership.clubId));

	// Sort: leaders first, then members
	members.sort((a, b) => {
		if (a.role === 'leader' && b.role !== 'leader') return -1;
		if (a.role !== 'leader' && b.role === 'leader') return 1;
		return a.name.localeCompare(b.name);
	});

	// Calculate club hours from devlogs on shipped club projects
	// Get project IDs that were shipped as this club
	const clubShips = await db
		.selectDistinct({ projectId: ship.projectId })
		.from(ship)
		.where(eq(ship.clubId, userMembership.clubId));

	let totalMinutes = 0;
	if (clubShips.length > 0) {
		const projectIds = clubShips.map((s) => s.projectId);
		const [result] = await db
			.select({
				total: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`
			})
			.from(devlog)
			.where(and(inArray(devlog.projectId, projectIds), eq(devlog.deleted, false)));
		totalMinutes = result?.total ?? 0;
	}

	const totalHours = Math.floor(totalMinutes / 60);

	return {
		linked: true,
		clubName: userMembership.clubName,
		joinCode: userMembership.joinCode,
		role: userMembership.role,
		members,
		totalHours
	};
}

export const actions = {
	linkLeader: async ({ locals }) => {
		if (!locals.user) {
			throw error(500);
		}

		// Check if already linked
		const existing = await db
			.select({ id: clubMembership.id })
			.from(clubMembership)
			.where(eq(clubMembership.userId, locals.user.id))
			.limit(1);

		if (existing.length > 0) {
			return fail(400, { alreadyLinked: true });
		}

		// Call external API to get leader's club
		const leaderClub = await getLeaderClub(locals.user.slackId);
		if (!leaderClub || !leaderClub.clubName) {
			return fail(400, { notALeader: true });
		}

		// Upsert club
		const [existingClub] = await db
			.select({ id: club.id })
			.from(club)
			.where(eq(club.name, leaderClub.clubName))
			.limit(1);

		let clubId: number;
		const generatedJoinCode = generateJoinCode();
		if (existingClub) {
			clubId = existingClub.id;
			// Set join code if not already set
			await db
				.update(club)
				.set({ joinCode: generatedJoinCode })
				.where(and(eq(club.id, clubId), sql`${club.joinCode} IS NULL`));
		} else {
			const [newClub] = await db
				.insert(club)
				.values({ name: leaderClub.clubName, joinCode: generatedJoinCode })
				.returning({ id: club.id });
			clubId = newClub.id;
		}

		// Create membership as leader
		await db.insert(clubMembership).values({
			clubId,
			userId: locals.user.id,
			role: 'leader'
		});

		return { success: true };
	},

	joinByCode: async ({ locals, request }) => {
		if (!locals.user) {
			throw error(500);
		}

		const data = await request.formData();
		const code = data.get('code')?.toString()?.trim();

		if (!code || code.length < 3) {
			return fail(400, { invalidCode: true });
		}

		// Check if already linked
		const existing = await db
			.select({ id: clubMembership.id })
			.from(clubMembership)
			.where(eq(clubMembership.userId, locals.user.id))
			.limit(1);

		if (existing.length > 0) {
			return fail(400, { alreadyLinked: true });
		}

		// Look up club by join code in local database
		const [existingClub] = await db
			.select({ id: club.id, name: club.name })
			.from(club)
			.where(eq(club.joinCode, code.toUpperCase()))
			.limit(1);

		if (!existingClub) {
			return fail(400, { invalidCode: true });
		}

		const clubId = existingClub.id;

		// Create membership as member
		await db.insert(clubMembership).values({
			clubId,
			userId: locals.user.id,
			role: 'member'
		});

		return { success: true };
	},

	regenerateJoinCode: async ({ locals }) => {
		if (!locals.user) {
			throw error(500);
		}

		// Get user's membership (must be leader)
		const [membership] = await db
			.select({ clubId: clubMembership.clubId, role: clubMembership.role })
			.from(clubMembership)
			.where(eq(clubMembership.userId, locals.user.id))
			.limit(1);

		if (!membership || membership.role !== 'leader') {
			return fail(403, { notAllowed: true });
		}

		// Generate and set new join code
		const newCode = generateJoinCode();
		await db.update(club).set({ joinCode: newCode }).where(eq(club.id, membership.clubId));

		return { success: true };
	}
} satisfies Actions;
