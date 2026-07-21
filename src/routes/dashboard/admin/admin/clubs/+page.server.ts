import { db } from '$lib/server/db/index.js';
import { club, clubMembership, user, devlog, ship, project } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, and, sql, inArray } from 'drizzle-orm';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const clubsRaw = await db
		.select({
			id: club.id,
			name: club.name,
			joinCode: club.joinCode,
			createdAt: club.createdAt,
			memberCount: sql<number>`count(distinct ${clubMembership.userId})`,
			leaderName: sql<string | null>`min(case when ${clubMembership.role} = 'leader' then ${user.name} else null end)`
		})
		.from(club)
		.leftJoin(clubMembership, eq(clubMembership.clubId, club.id))
		.leftJoin(user, eq(clubMembership.userId, user.id))
		.groupBy(club.id)
		.orderBy(sql`count(distinct ${clubMembership.userId}) desc`);

	const allShips = await db
		.select({
			clubId: ship.clubId,
			projectId: project.id
		})
		.from(project)
		.innerJoin(ship, eq(ship.projectId, project.id))
		.where(and(eq(project.status, 'finalized'), sql`${ship.clubId} is not null`));

	const shipsByClub = new Map<number, number[]>();
	for (const s of allShips) {
		if (!s.clubId) continue;
		const list = shipsByClub.get(s.clubId);
		if (list) {
			list.push(s.projectId);
		} else {
			shipsByClub.set(s.clubId, [s.projectId]);
		}
	}

	const allProjectIds = [...new Set(allShips.map((s) => s.projectId).filter(Boolean))];

	let devlogsByProject: Map<number, { totalMinutes: number; devlogCount: number }> = new Map();
	if (allProjectIds.length > 0) {
		const devlogRows = await db
			.select({
				projectId: devlog.projectId,
				totalMinutes: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`,
				devlogCount: sql<number>`COALESCE(COUNT(${devlog.id}), 0)`
			})
			.from(devlog)
			.where(and(inArray(devlog.projectId, allProjectIds), eq(devlog.deleted, false)))
			.groupBy(devlog.projectId);

		for (const row of devlogRows) {
			devlogsByProject.set(row.projectId, {
				totalMinutes: row.totalMinutes,
				devlogCount: row.devlogCount
			});
		}
	}

	const clubsWithStats = clubsRaw.map((c) => {
		const clubProjectIds = shipsByClub.get(c.id) ?? [];
		const shipCount = clubProjectIds.length;

		let totalMinutes = 0;
		let devlogCount = 0;
		for (const pid of clubProjectIds) {
			const stats = devlogsByProject.get(pid);
			if (stats) {
				totalMinutes += stats.totalMinutes;
				devlogCount += stats.devlogCount;
			}
		}

		const avgMinutesPerMember = c.memberCount > 0 ? Math.round(totalMinutes / c.memberCount) : 0;

		return {
			...c,
			shipCount,
			totalMinutes,
			devlogCount,
			avgMinutesPerMember
		};
	});

	clubsWithStats.sort((a, b) => b.shipCount - a.shipCount);

	const totalClubs = clubsWithStats.length;
	const totalMembers = clubsWithStats.reduce((s, c) => s + c.memberCount, 0);
	const totalMinutes = clubsWithStats.reduce((s, c) => s + c.totalMinutes, 0);
	const totalShips = clubsWithStats.reduce((s, c) => s + c.shipCount, 0);
	const totalDevlogs = clubsWithStats.reduce((s, c) => s + c.devlogCount, 0);

	return {
		clubs: clubsWithStats,
		totalClubs,
		totalMembers,
		totalMinutes,
		totalShips,
		totalDevlogs
	};
}
