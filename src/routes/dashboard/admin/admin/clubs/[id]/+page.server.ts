import { db } from '$lib/server/db/index.js';
import { club, clubMembership, user, devlog, ship, project } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { eq, and, sql, inArray } from 'drizzle-orm';

export async function load({ locals, params }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const clubId = Number(params.id);
	if (isNaN(clubId)) {
		throw error(404);
	}

	const [clubInfo] = await db
		.select({
			id: club.id,
			name: club.name,
			joinCode: club.joinCode,
			createdAt: club.createdAt
		})
		.from(club)
		.where(eq(club.id, clubId))
		.limit(1);

	if (!clubInfo) {
		throw error(404);
	}

	const members = await db
		.select({
			id: user.id,
			name: user.name,
			profilePicture: user.profilePicture,
			role: clubMembership.role
		})
		.from(clubMembership)
		.innerJoin(user, eq(clubMembership.userId, user.id))
		.where(eq(clubMembership.clubId, clubId));

	members.sort((a, b) => {
		if (a.role === 'leader' && b.role !== 'leader') return -1;
		if (a.role !== 'leader' && b.role === 'leader') return 1;
		return a.name.localeCompare(b.name);
	});

	const clubShips = await db
		.selectDistinct({ projectId: project.id })
		.from(project)
		.innerJoin(ship, eq(ship.projectId, project.id))
		.where(and(eq(project.status, 'finalized'), eq(ship.clubId, clubId)));

	const projectIds = clubShips.map((s) => s.projectId);
	const shipCount = projectIds.length;

	const memberIds = members.map((m) => m.id);

	const devlogByUser = new Map<number, { totalMinutes: number; devlogCount: number }>();
	if (projectIds.length > 0) {
		const devlogRows = await db
			.select({
				userId: devlog.userId,
				totalMinutes: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`,
				devlogCount: sql<number>`COALESCE(COUNT(${devlog.id}), 0)`
			})
			.from(devlog)
			.where(
				and(
					inArray(devlog.projectId, projectIds),
					inArray(devlog.userId, memberIds),
					eq(devlog.deleted, false)
				)
			)
			.groupBy(devlog.userId);

		for (const row of devlogRows) {
			if (row.userId === null) continue;
			devlogByUser.set(row.userId, {
				totalMinutes: Number(row.totalMinutes) || 0,
				devlogCount: Number(row.devlogCount) || 0
			});
		}
	}

	const totalMinutes = [...devlogByUser.values()].reduce((s, u) => s + u.totalMinutes, 0);

	const membersWithTime = members.map((m) => {
		const stats = devlogByUser.get(m.id) ?? { totalMinutes: 0, devlogCount: 0 };
		return { ...m, ...stats };
	});

	membersWithTime.sort((a, b) => b.totalMinutes - a.totalMinutes);

	return {
		club: clubInfo,
		totalMinutes,
		shipCount,
		members: membersWithTime
	};
}
