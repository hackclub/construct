import { db } from '$lib/server/db/index.js';
import { user, project } from '$lib/server/db/schema.js';
import { error } from '@sveltejs/kit';
import { sql, and, eq, asc } from 'drizzle-orm';

export async function load({ locals }) {
	if (!locals.user) {
		throw error(500);
	}
	if (!locals.user.hasAdmin) {
		throw error(403, { message: 'oi get out' });
	}

	const users = await db
		.select({
			id: user.id,
			name: user.name,
			slackId: user.slackId,
			clay: user.clay,
			brick: user.brick,
			shopScore: user.shopScore,
			projectCreatedAt:
				sql<string>`(array_agg(${project.createdAt} ORDER BY ${project.createdAt} ASC))[1]`
					.mapWith((val) => new Date(val))
					.as('first_created_at')
		})
		.from(project)
		.innerJoin(user, eq(project.userId, user.id))
		.where(
			and(
				eq(project.status, 'finalized'),
				eq(project.deleted, false),
				eq(user.stickersShipped, false)
			)
		)
		.groupBy(user.id)
		.orderBy(asc(sql`(array_agg(${project.createdAt} ORDER BY ${project.createdAt} ASC))[1]`));

	return {
		users
	};
}
