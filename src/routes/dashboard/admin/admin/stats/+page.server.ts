import { db } from '$lib/server/db/index.js';
import { project, user, devlog } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { count, eq, sql, and, ne, countDistinct } from 'drizzle-orm';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'get out, peasant' });
	}

	const [users] = await db
		.select({
			count: count(),
			total: {
				clay: sql<number>`sum(${user.clay})`,
				brick: sql<number>`sum(${user.brick})`,
				shopScore: sql<number>`sum(${user.shopScore})`,
			},
			average: {
				clay: sql<number>`avg(${user.clay})`,
				brick: sql<number>`avg(${user.brick})`,
				shopScore: sql<number>`avg(${user.shopScore})`,
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

	const [shippedProjectCount] = await db
		.select({
			count: count()
		})
		.from(project)
		.where(and(eq(project.deleted, false), ne(project.status, 'building')));

	const [devlogs] = await db
		.select({
			count: count(),
			totalTime: sql<number>`sum(${devlog.timeSpent})`,
			timePerDevlog: sql<number>`avg(${devlog.timeSpent})`
		})
		.from(devlog)
		.where(eq(devlog.deleted, false));

	return {
		users: users,
		project: projectCount,
		usersWithProjects,
		shippedProjectCount: shippedProjectCount.count,
		devlogs
	};
}
