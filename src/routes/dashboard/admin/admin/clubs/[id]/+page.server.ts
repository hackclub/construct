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

	let totalMinutes = 0;
	const projectIds: number[] = [];
	if (clubShips.length > 0) {
		for (const s of clubShips) {
			projectIds.push(s.projectId);
		}
		const [result] = await db
			.select({
				total: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`
			})
			.from(devlog)
			.where(and(inArray(devlog.projectId, projectIds), eq(devlog.deleted, false)));
		totalMinutes = result?.total ?? 0;
	}

	const membersWithTime = await Promise.all(
		members.map(async (m) => {
			let memberMinutes = 0;
			let memberDevlogs = 0;
			if (projectIds.length > 0) {
				const [result] = await db
					.select({
						total: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`,
						count: sql<number>`COALESCE(COUNT(${devlog.id}), 0)`
					})
					.from(devlog)
					.where(
						and(
							inArray(devlog.projectId, projectIds),
							eq(devlog.deleted, false),
							eq(devlog.userId, m.id)
						)
					);
				memberMinutes = result?.total ?? 0;
				memberDevlogs = result?.count ?? 0;
			}
			return {
				...m,
				totalMinutes: memberMinutes,
				devlogCount: memberDevlogs
			};
		})
	);

	membersWithTime.sort((a, b) => b.totalMinutes - a.totalMinutes);

	const shipCount = projectIds.length;

	return {
		club: clubInfo,
		totalMinutes,
		shipCount,
		members: membersWithTime
	};
}
