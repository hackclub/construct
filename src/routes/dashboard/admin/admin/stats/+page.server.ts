import { db } from '$lib/server/db/index.js';
import { project, user, devlog } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { count, eq, sql, and, ne, countDistinct } from 'drizzle-orm';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const [users] = await db
		.select({
			count: count(),
			total: {
				clay: sql<number>`sum(${user.clay})`,
				brick: sql<number>`sum(${user.brick})`,
				shopScore: sql<number>`sum(${user.shopScore})`
			},
			average: {
				clay: sql<number>`avg(${user.clay})`,
				brick: sql<number>`avg(${user.brick})`,
				shopScore: sql<number>`avg(${user.shopScore})`
			}
		})
		.from(user);

	const [usersWithProjects] = await db
		.select({
			total: countDistinct(project.userId),
			shipped: sql<number>`count(distinct ${project.userId}) filter (where ${project.status} != 'building')`
		})
		.from(project)
		.where(eq(project.deleted, false));

	const [projectCount] = await db
		.select({
			count: count(),
			building: sql<number>`count(*) filter (where ${project.status} = 'building')`,
			submitted: sql<number>`count(*) filter (where ${project.status} = 'submitted')`,
			t1_approved: sql<number>`count(*) filter (where ${project.status} = 't1_approved')`,
			printing: sql<number>`count(*) filter (where ${project.status} = 'printing')`,
			printed: sql<number>`count(*) filter (where ${project.status} = 'printed')`,
			finalized: sql<number>`count(*) filter (where ${project.status} = 'finalized')`,
			rejected: sql<number>`count(*) filter (where ${project.status} = 'rejected')`,
			rejected_locked: sql<number>`count(*) filter (where ${project.status} = 'rejected_locked')`
		})
		.from(project)
		.where(eq(project.deleted, false));

	const [devlogs] = await db
		.select({
			count: count(),
			totalTime: sql<number>`sum(${devlog.timeSpent})`,
			timePerDevlog: sql<number>`avg(${devlog.timeSpent})`
		})
		.from(devlog)
		.where(eq(devlog.deleted, false));

	const shippedProjects = db
		.select({
			id: project.id,
			timeSpent: sql<number>`COALESCE(SUM(${devlog.timeSpent}), 0)`.as('time_spent'),
			devlogCount: sql<number>`COALESCE(COUNT(${devlog.id}), 0)`.as('devlog_count')
		})
		.from(project)
		.leftJoin(devlog, and(eq(project.id, devlog.projectId), eq(devlog.deleted, false)))
		.where(and(eq(project.deleted, false), ne(project.status, 'building')))
		.groupBy(project.id)
		.as('shippedProjects');

	const [shippedStats] = await db
		.select({
			count: count(),
			totalTimeSpent: sql<number>`sum(${shippedProjects.timeSpent})`,
			averageTimeSpent: sql<number>`avg(${shippedProjects.timeSpent})`,
			totalDevlogs: sql<number>`sum(${shippedProjects.devlogCount})`,
			averageDevlogs: sql<number>`avg(${shippedProjects.devlogCount})`
		})
		.from(shippedProjects);

	return {
		users: users,
		project: projectCount,
		usersWithProjects,
		shippedStats,
		devlogs
	};
}
