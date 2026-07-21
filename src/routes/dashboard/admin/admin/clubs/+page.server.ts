import { db } from '$lib/server/db/index.js';
import { club, clubMembership, devlog, project, ship, user } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { and, countDistinct, eq, isNotNull, sql } from 'drizzle-orm';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const latestShipIds = db
		.select({
			projectId: ship.projectId,
			latestShipId: sql<number>`max(${ship.id})`.as('latest_ship_id')
		})
		.from(ship)
		.groupBy(ship.projectId)
		.as('latestShipIds');

	const latestShips = db
		.select({
			projectId: ship.projectId,
			clubId: ship.clubId
		})
		.from(ship)
		.innerJoin(
			latestShipIds,
			and(eq(ship.id, latestShipIds.latestShipId), eq(ship.projectId, latestShipIds.projectId))
		)
		.as('latestShips');

	const clubs = await db
		.select({
			id: club.id,
			name: club.name,
			memberCount: countDistinct(clubMembership.userId)
		})
		.from(club)
		.leftJoin(clubMembership, eq(clubMembership.clubId, club.id))
		.groupBy(club.id)
		.orderBy(club.name);

	const clubMembers = await db
		.select({
			clubId: clubMembership.clubId,
			userId: user.id,
			name: user.name,
			profilePicture: user.profilePicture,
			role: clubMembership.role
		})
		.from(clubMembership)
		.innerJoin(user, eq(clubMembership.userId, user.id));

	const shippedStatsByClub = await db
		.select({
			clubId: latestShips.clubId,
			shippedProjects: countDistinct(project.id),
			totalMinutes: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`
		})
		.from(project)
		.innerJoin(latestShips, eq(latestShips.projectId, project.id))
		.leftJoin(devlog, and(eq(devlog.projectId, project.id), eq(devlog.deleted, false)))
		.where(
			and(
				eq(project.deleted, false),
				eq(project.status, 'finalized'),
				isNotNull(latestShips.clubId)
			)
		)
		.groupBy(latestShips.clubId);

	const memberShippedMinutes = await db
		.select({
			clubId: latestShips.clubId,
			userId: devlog.userId,
			totalMinutes: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`
		})
		.from(devlog)
		.innerJoin(project, eq(devlog.projectId, project.id))
		.innerJoin(latestShips, eq(latestShips.projectId, project.id))
		.innerJoin(
			clubMembership,
			and(eq(clubMembership.userId, devlog.userId), eq(clubMembership.clubId, latestShips.clubId))
		)
		.where(
			and(
				eq(project.deleted, false),
				eq(project.status, 'finalized'),
				eq(devlog.deleted, false),
				isNotNull(devlog.userId),
				isNotNull(latestShips.clubId)
			)
		)
		.groupBy(latestShips.clubId, devlog.userId);

	const shippedStatsByClubMap = new Map(
		shippedStatsByClub.map((stats) => [
			stats.clubId,
			{
				shippedProjects: stats.shippedProjects,
				totalMinutes: stats.totalMinutes
			}
		])
	);

	const memberMinutesMap = new Map(
		memberShippedMinutes.map((memberStats) => [
			`${memberStats.clubId}-${memberStats.userId}`,
			memberStats.totalMinutes
		])
	);

	const clubsWithStats = clubs
		.map((currentClub) => {
			const shippedStats = shippedStatsByClubMap.get(currentClub.id) ?? {
				shippedProjects: 0,
				totalMinutes: 0
			};

			const members = clubMembers
				.filter((member) => member.clubId === currentClub.id)
				.map((member) => {
					const shippedMinutes = memberMinutesMap.get(`${currentClub.id}-${member.userId}`) ?? 0;
					return {
						...member,
						shippedMinutes
					};
				})
				.sort((a, b) => {
					if (b.shippedMinutes !== a.shippedMinutes) return b.shippedMinutes - a.shippedMinutes;
					if (a.role === 'leader' && b.role !== 'leader') return -1;
					if (a.role !== 'leader' && b.role === 'leader') return 1;
					return a.name.localeCompare(b.name);
				});

			return {
				...currentClub,
				shippedProjects: shippedStats.shippedProjects,
				totalMinutes: shippedStats.totalMinutes,
				members
			};
		})
		.sort((a, b) => b.totalMinutes - a.totalMinutes || a.name.localeCompare(b.name));

	return {
		clubs: clubsWithStats
	};
}
